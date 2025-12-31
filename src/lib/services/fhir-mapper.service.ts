import { v4 as uuidv4 } from 'uuid';
import type {
    FhirBundle, FhirCondition, FhirObservation, FhirQuestionnaireResponse,
    FhirFamilyMemberHistory, FhirPatient, FhirProcedure, FhirImmunization,
    FhirMedicationStatement
} from "@/lib/types/fhir";
import { medicalConditionsMap } from "@/lib/mappings/medical-conditions.map";
import { cancerTypesMap } from "@/lib/mappings/cancer-types.map";
import { geneticGenesMap } from "@/lib/mappings/genetic-genes.map";
import { occupationalExposuresMap } from "@/lib/mappings/occupational-exposures.map";

// Coding Systems
const SYSTEM_SNOMED = "http://snomed.info/sct";
const SYSTEM_LOINC = "http://loinc.org";
const SYSTEM_UCUM = "http://unitsofmeasure.org";
const SYSTEM_HGNC = "http://www.genenames.org";
const SYSTEM_HPO = "http://human-phenotype-ontology.org";
const SYSTEM_ONKONO = "http://onkono.com/fhir/CodeSystem/measures"; // Internal system for derived scores
const SYSTEM_HL7_ROLE = "http://terminology.hl7.org/CodeSystem/v3-RoleCode";

export const FhirMapperService = {

    toFhirBundle(answers: Record<string, any>, standardized: any, derived: any): FhirBundle {
        const bundle: FhirBundle = {
            resourceType: "Bundle",
            type: "collection",
            entry: []
        };

        // Helper for MedicationStatements
        const addMedication = (code: string, display: string, reason?: string) => {
            const med: FhirMedicationStatement = {
                resourceType: "MedicationStatement",
                id: uuidv4(),
                status: "active",
                subject: { reference: patientId },
                medicationCodeableConcept: {
                    coding: [{ system: SYSTEM_SNOMED, code: code, display: display }]
                }
            };
            if (reason) {
                med.reasonCode = [{ coding: [], text: reason }];
            }
            bundle.entry.push({ resource: med });
        };

        const patientId = `Patient/${uuidv4()}`;
        const subjectRef = { reference: patientId };

        // --- 1. Patient Resource ---
        const patient: FhirPatient = {
            resourceType: "Patient",
            id: patientId.split('/')[1],
            birthDate: standardized.core.dob, // YYYY or YYYY-MM-DD
            gender: standardized.core.sex_at_birth === 'Male' ? 'male' :
                standardized.core.sex_at_birth === 'Female' ? 'female' : 'other'
        };
        bundle.entry.push({ resource: patient });

        // --- 2. QuestionnaireResponse (Raw Audit) ---
        const qr: FhirQuestionnaireResponse = {
            resourceType: "QuestionnaireResponse",
            id: uuidv4(),
            status: "completed",
            authored: new Date().toISOString(),
            item: Object.entries(answers).map(([key, value]) => ({
                linkId: key,
                answer: [{ valueString: String(value) }]
            }))
        };
        bundle.entry.push({ resource: qr });

        // --- 2a. Medication Statements ---
        // Antivirals (HBV/HCV/HIV)
        if (standardized.advanced?.illnesses) {
            standardized.advanced.illnesses.forEach((illness: any) => {
                if (illness.id === 'hbv' && illness.antiviral === 'Yes') {
                    addMedication('416897008', 'Antiviral agent', 'Chronic Hepatitis B');
                }
                if (illness.id === 'hiv') { // Assuming hiv logic exists or will exist logic
                    addMedication('416897008', 'Antiviral agent (ART)', 'HIV');
                }
            });
        }

        // HRT
        if (answers['female.hrt_user'] === 'Yes') {
            addMedication('396086005', 'Hormone replacement therapy', 'Menopause management');
        }

        // Immunosuppressants
        if (answers['meds.immunosuppressant'] === 'Yes') {
            addMedication('418471003', 'Immunosuppressant', 'Immune suppression');
        }

        // --- 3. Conditions (Medical History) ---
        if (standardized.advanced?.illnesses) {
            standardized.advanced.illnesses.forEach((illness: any) => {
                const snomedCode = medicalConditionsMap[illness.id];
                if (snomedCode) {
                    const condition: FhirCondition = {
                        resourceType: "Condition",
                        id: uuidv4(),
                        subject: subjectRef,
                        code: {
                            coding: [{ system: SYSTEM_SNOMED, code: snomedCode, display: illness.id }]
                        },
                        clinicalStatus: {
                            coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: illness.status === 'resolved' ? 'resolved' : 'active' }]
                        }
                    };
                    if (illness.year) condition.onsetDateTime = `${illness.year}`;
                    bundle.entry.push({ resource: condition });
                }
            });
        }

        // --- 4. Current Symptoms (HPO Codes) with Severity ---
        if (standardized.core?.symptoms && Array.isArray(standardized.core.symptoms)) {
            standardized.core.symptoms.forEach((symptomId: string) => {
                // Check if it's an HPO code (starts with HP:)
                const isHpo = symptomId.startsWith('HP:');
                const details = standardized.advanced?.symptom_details?.[symptomId];

                const condition: FhirCondition = {
                    resourceType: "Condition",
                    id: uuidv4(),
                    subject: subjectRef,
                    code: {
                        coding: isHpo
                            ? [{ system: SYSTEM_HPO, code: symptomId }]
                            : [{ system: SYSTEM_ONKONO, code: symptomId }] // Use internal system for local codes
                    },
                    clinicalStatus: {
                        coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }]
                    },
                    verificationStatus: {
                        coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "provisional" }]
                    }
                };

                // Add onset year if available, with month precision if present
                if (details?.onset_year) {
                    if (details.onset_month && Number(details.onset_month) >= 1 && Number(details.onset_month) <= 12) {
                        const month = Number(details.onset_month).toString().padStart(2, '0');
                        condition.onsetDateTime = `${details.onset_year}-${month}`;
                    } else {
                        condition.onsetDateTime = `${details.onset_year}`;
                    }
                }

                bundle.entry.push({ resource: condition });

                // Map Symptom Severity (0-10) as separate Observation if available
                if (details?.severity !== undefined) {
                    const severityObs: FhirObservation = {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: {
                            coding: [
                                { system: SYSTEM_LOINC, code: "72514-3", display: "Pain severity" }, // Generic severity code
                                { system: SYSTEM_ONKONO, code: `onkn.symptom.severity.${symptomId}`, display: `Severity of ${symptomId}` }
                            ]
                        },
                        subject: subjectRef,
                        valueQuantity: {
                            value: details.severity,
                            unit: "{score}",
                            system: SYSTEM_UCUM,
                            code: "{score}"
                        }
                    };
                    bundle.entry.push({ resource: severityObs });
                }
            });
        }

        // --- 4a. Social History (Smoking & Alcohol Status) ---
        // Smoking Status
        if (standardized.core.smoking_status) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "social-history", display: "Social History" }] }],
                    code: {
                        coding: [
                            { system: SYSTEM_LOINC, code: "72166-2", display: "Tobacco smoking status" },
                            { system: SYSTEM_ONKONO, code: "onkn.social.smoking_status", display: "Smoking Status" }
                        ]
                    },
                    subject: subjectRef,
                    valueString: standardized.core.smoking_status // "Never", "Former", "Current"
                } as FhirObservation
            });
        }

        // Alcohol Status
        if (standardized.core.alcohol_status) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "social-history", display: "Social History" }] }],
                    code: {
                        coding: [
                            { system: SYSTEM_SNOMED, code: "160573003", display: "Alcohol intake" }, // General parent code
                            { system: SYSTEM_ONKONO, code: "onkn.social.alcohol_status", display: "Alcohol Status" }
                        ]
                    },
                    subject: subjectRef,
                    valueString: standardized.core.alcohol_status // "Lifetime abstainer", etc.
                } as FhirObservation
            });
        }

        // --- 5. Observations (Derived Metrics) ---

        // BMI
        if (derived.bmi?.value) {
            const bmiObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: { coding: [{ system: SYSTEM_LOINC, code: "39156-5", display: "Body mass index" }] },
                subject: subjectRef,
                valueQuantity: {
                    value: derived.bmi.value,
                    unit: "kg/m2",
                    system: SYSTEM_UCUM,
                    code: "kg/m2"
                }
            };
            bundle.entry.push({ resource: bmiObs });
        }

        // Pack Years
        if (derived.pack_years && derived.pack_years > 0) {
            const pyObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: { coding: [{ system: SYSTEM_SNOMED, code: "401201003", display: "Cigarette pack-years" }] },
                subject: subjectRef,
                valueQuantity: {
                    value: derived.pack_years,
                    unit: "{pack-years}",
                    system: SYSTEM_UCUM,
                    code: "{pack-years}"
                }
            };
            bundle.entry.push({ resource: pyObs });
        }

        // AUDIT-C Score (onkn.alcohol.audit_c_score)
        if (derived.alcohol_audit?.score !== undefined) {
            const auditObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: {
                    coding: [
                        { system: SYSTEM_LOINC, code: "75626-2", display: "AUDIT-C Total Score" },
                        { system: SYSTEM_ONKONO, code: "onkn.alcohol.audit_c_score", display: "AUDIT-C Score" }
                    ]
                },
                subject: subjectRef,
                valueQuantity: {
                    value: derived.alcohol_audit.score,
                    unit: "{score}",
                    system: SYSTEM_UCUM,
                    code: "{score}"
                }
            };
            bundle.entry.push({ resource: auditObs });
        }

        // IPAQ MET-minutes (onkn.pa.met.total)
        if (derived.physical_activity_ipaq?.metMinutes !== undefined) {
            const ipaqObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: {
                    coding: [
                        { system: SYSTEM_ONKONO, code: "onkn.pa.met.total", display: "IPAQ Total MET-minutes per week" }
                    ]
                },
                subject: subjectRef,
                valueQuantity: {
                    value: derived.physical_activity_ipaq.metMinutes,
                    unit: "MET.min/wk",
                    system: SYSTEM_UCUM,
                    code: "MET.min/wk"
                }
            };
            bundle.entry.push({ resource: ipaqObs });

            // Granular Breakdown
            if (derived.physical_activity_ipaq.components) {
                const { walk, mod, vig } = derived.physical_activity_ipaq.components;

                const metrics = [
                    { key: 'walk', val: walk, display: 'Walking MET-minutes' },
                    { key: 'mod', val: mod, display: 'Moderate Activity MET-minutes' },
                    { key: 'vig', val: vig, display: 'Vigorous Activity MET-minutes' }
                ];

                metrics.forEach(m => {
                    if (m.val !== undefined) {
                        bundle.entry.push({
                            resource: {
                                resourceType: "Observation",
                                id: uuidv4(),
                                status: "final",
                                code: {
                                    coding: [
                                        { system: SYSTEM_ONKONO, code: `onkn.pa.met.${m.key}`, display: m.display }
                                    ]
                                },
                                subject: subjectRef,
                                valueQuantity: {
                                    value: m.val,
                                    unit: "MET.min/wk",
                                    system: SYSTEM_UCUM,
                                    code: "MET.min/wk"
                                }
                            } as FhirObservation
                        });
                    }
                });
            }
        }

        // WCRF Score (onkn.wcrf.diet_total)
        if (derived.wcrf_score?.score !== undefined) {
            const wcrfObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: {
                    coding: [
                        { system: SYSTEM_ONKONO, code: "onkn.wcrf.diet_total", display: "WCRF Dietary Compliance Score" }
                    ]
                },
                subject: subjectRef,
                valueQuantity: {
                    value: derived.wcrf_score.score,
                    unit: "{score}",
                    system: SYSTEM_UCUM,
                    code: "{score}"
                }
            };
            bundle.entry.push({ resource: wcrfObs });
        }

        // Exposure Composites flattening
        if (derived.exposure_composites) {
            Object.entries(derived.exposure_composites).forEach(([key, value]) => {
                if (typeof value === 'boolean') {
                    bundle.entry.push({
                        resource: {
                            resourceType: "Observation",
                            id: uuidv4(),
                            status: "final",
                            code: {
                                coding: [
                                    { system: SYSTEM_ONKONO, code: `onkn.exposure.${key}`, display: key.replace(/_/g, ' ') }
                                ]
                            },
                            subject: subjectRef,
                            valueBoolean: value
                        } as FhirObservation
                    });
                }
            });
        }

        // Occupational History (Detailed)
        if (standardized.advanced?.occupational && Array.isArray(standardized.advanced.occupational)) {
            standardized.advanced.occupational.forEach((job: any) => {
                const jobObs: FhirObservation = {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: {
                        coding: [
                            { system: SYSTEM_ONKONO, code: "onkn.occ.job_history", display: "Occupational History" }
                        ]
                    },
                    subject: subjectRef,
                    valueString: job.job_title || "Unknown Job",
                    component: []
                };

                if (job.years) {
                    jobObs.component?.push({
                        code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.occ.years_total", display: "Years Exposed" }] },
                        valueQuantity: { value: job.years, unit: "a", system: SYSTEM_UCUM, code: "a" }
                    });
                }

                // Hours per week
                if (job.hours_week) {
                    jobObs.component?.push({
                        code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.occ.hours_per_week", display: "Hours per week" }] },
                        valueQuantity: { value: Number(job.hours_week), unit: "h/wk", system: SYSTEM_UCUM, code: "h/wk" }
                    });
                }

                // We don't have explicit 'year_first_exposed' in the standardized object shown in derived-vars, 
                // but if it exists in the source, we map it. 
                // Assuming strict output mapping requirement, we include it if present.
                if (job.start_year) {
                    jobObs.component?.push({
                        code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.occ.year_first_exposed", display: "First Year Exposed" }] },
                        valueDateTime: `${job.start_year}`
                    });
                }

                bundle.entry.push({ resource: jobObs });
            });
        }

        // Sexual Health Flags

        // MSM Behavior (onkn.sex.msm_behavior)
        if (derived['sex.msm_behavior'] === true) {
            const msmObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: {
                    coding: [
                        { system: SYSTEM_ONKONO, code: "onkn.sex.msm_behavior", display: "MSM Behavior Pattern" }
                    ]
                },
                subject: subjectRef,
                valueBoolean: true
            };
            bundle.entry.push({ resource: msmObs });
        }

        // HPV Exposure Band (onkn.sex.hpv_exposure_band)
        if (derived['sex.hpv_exposure_band']) {
            const hpvBandObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: {
                    coding: [
                        { system: SYSTEM_ONKONO, code: "onkn.sex.hpv_exposure_band", display: "HPV Exposure Risk Band" }
                    ]
                },
                subject: subjectRef,
                valueString: derived['sex.hpv_exposure_band']
            };
            bundle.entry.push({ resource: hpvBandObs });
        }

        // Sexual Health: New Partner 12m
        if (derived['sex.new_partner_12m']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.sex.new_partner_12m", display: "New Partner in last 12 months" }] },
                    subject: subjectRef,
                    valueString: derived['sex.new_partner_12m']
                } as FhirObservation
            });
        }

        // Sexual Health: Sex Work Ever
        if (derived['sex.sex_work_ever']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.sex.sex_work_ever", display: "History of Sex Work" }] },
                    subject: subjectRef,
                    valueString: derived['sex.sex_work_ever']
                } as FhirObservation
            });
        }

        // --- Screening Results (Observations) ---
        const screening = standardized.advanced?.screening_immunization || {};

        // Cervical Screening Result
        if (screening['screen.cervix.last_result']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: {
                        coding: [
                            { system: SYSTEM_ONKONO, code: "onkn.screen.cervix.result", display: "Cervical Screening Result" }
                        ]
                    },
                    subject: subjectRef,
                    valueString: screening['screen.cervix.last_result']
                } as FhirObservation
            });
        }

        // Mammogram Result
        if (screening['screen.breast.mammo_last_result']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: {
                        coding: [
                            { system: SYSTEM_ONKONO, code: "onkn.screen.breast.result", display: "Mammogram Result" }
                        ]
                    },
                    subject: subjectRef,
                    valueString: screening['screen.breast.mammo_last_result']
                } as FhirObservation
            });
        }

        // Colorectal Screening Result
        if (screening['screen.crc.last_result']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: {
                        coding: [
                            { system: SYSTEM_ONKONO, code: "onkn.screen.crc.result", display: "Colorectal Screening Result" }
                        ]
                    },
                    subject: subjectRef,
                    valueString: screening['screen.crc.last_result']
                } as FhirObservation
            });
        }

        // Lung CT Result
        if (screening['screen.lung.ldct_last_result']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: {
                        coding: [
                            { system: SYSTEM_ONKONO, code: "onkn.screen.lung.result", display: "Lung CT Result" }
                        ]
                    },
                    subject: subjectRef,
                    valueString: screening['screen.lung.ldct_last_result']
                } as FhirObservation
            });
        }

        // PSA Elevated Flag
        if (screening['screen.prostate.psa_abnormal']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: {
                        coding: [
                            { system: SYSTEM_ONKONO, code: "onkn.screen.prostate.psa_abnormal_or_biopsy", display: "PSA Elevated Flag" }
                        ]
                    },
                    subject: subjectRef,
                    valueBoolean: screening['screen.prostate.psa_abnormal'] === 'Yes' || screening['screen.prostate.psa_abnormal'] === true
                } as FhirObservation
            });
        }

        // Functional Status: Falls
        if (standardized.advanced?.functional_status) {
            // Handle if it's an object or part of an array, assuming object based on single-choice nature but standard is usually array of modules.
            // If standardized.advanced.functional_status is an object:
            const func = standardized.advanced.functional_status;
            // If it's an array of answers (less likely for this logic, but safe check needed? No, usually standardized is flattened or obj).
            // Let's assume it's an object like others.

            // falls_last_year
            if (func['func.falls_last_year']) {
                bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: {
                            coding: [
                                { system: SYSTEM_ONKONO, code: "onkn.func.falls_last_year", display: "Falls in last year" }
                            ]
                        },
                        subject: subjectRef,
                        valueBoolean: func['func.falls_last_year'] === 'Yes'
                    } as FhirObservation
                });
            }

            // ADL Help
            if (func['func.adl_help']) {
                bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: {
                            coding: [
                                { system: SYSTEM_ONKONO, code: "onkn.func.adl_help", display: "Needs help with Activities of Daily Living" }
                            ]
                        },
                        subject: subjectRef,
                        valueBoolean: func['func.adl_help'] === 'Yes'
                    } as FhirObservation
                });
            }
        }

        // --- Derived Eligibility Flags & Risk Observations ---
        // Dynamically iterate over all derived flags (occ.*, env.*, gen.*, etc.)
        Object.entries(derived).forEach(([key, value]) => {
            // Skip complex objects and metrics already handled specifically
            if (
                key === 'bmi' ||
                key === 'pack_years' ||
                key === 'physical_activity_ipaq' ||
                key === 'wcrf_score' ||
                key === 'alcohol_audit' ||
                key === 'exposure_composites' ||
                key === 'sex.msm_behavior' ||
                key === 'sex.hpv_exposure_band'
            ) {
                return;
            }

            // Map boolean flags to Observations
            if (typeof value === 'boolean') {
                const codeValue = key.startsWith('onkn.') ? key : (() => {
                    const parts = key.split('.');
                    if (parts.length > 1) {
                        return `onkn.${parts[0]}.flag.${parts.slice(1).join('.')}`;
                    }
                    return `onkn.flag.${key}`;
                })();

                bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: {
                            coding: [
                                { system: SYSTEM_ONKONO, code: codeValue, display: key.replace('onkn.derived.', '').replace(/_/g, ' ').replace(/\./g, ' ') }
                            ]
                        },
                        subject: subjectRef,
                        valueBoolean: value
                    } as FhirObservation
                });
            }

            // Map string array (joined) - e.g. hereditary_syndromes
            if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
                bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: {
                            coding: [
                                { system: SYSTEM_ONKONO, code: key.startsWith('onkn.') ? key : `onkn.derived.${key}`, display: key }
                            ]
                        },
                        subject: subjectRef,
                        valueString: value.join(', ')
                    } as FhirObservation
                });
            }

            // Map string or numeric single values
            if (typeof value === 'string') {
                bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: {
                            coding: [
                                { system: SYSTEM_ONKONO, code: key.startsWith('onkn.') ? key : `onkn.derived.${key}`, display: key.replace('onkn.derived.', '').replace(/_/g, ' ').replace(/\./g, ' ') }
                            ]
                        },
                        subject: subjectRef,
                        valueString: value
                    } as FhirObservation
                });
            }

            if (typeof value === 'number' && key !== 'pack_years') {
                bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: {
                            coding: [
                                { system: SYSTEM_ONKONO, code: key.startsWith('onkn.') ? key : `onkn.derived.${key}`, display: key.replace('onkn.derived.', '').replace(/_/g, ' ').replace(/\./g, ' ') }
                            ]
                        },
                        subject: subjectRef,
                        valueQuantity: {
                            value: value,
                            unit: "{score}",
                            system: SYSTEM_UCUM,
                            code: "{score}"
                        }
                    } as FhirObservation
                });
            }
        });

        // --- 6. Family History ---
        // --- 6. Family History ---
        // --- 6. Family History ---
        try {
            const rawFamily = standardized?.advanced?.family || (answers.family_cancer_history ? JSON.parse(answers.family_cancer_history) : []);
            if (Array.isArray(rawFamily)) {
                rawFamily.forEach((member: any) => {
                    const fmh: FhirFamilyMemberHistory = {
                        resourceType: "FamilyMemberHistory",
                        id: uuidv4(),
                        status: "completed",
                        patient: subjectRef,
                        relationship: { text: member.relation, coding: [] },
                        condition: []
                    };

                    if (Array.isArray(member.cancers)) {
                        member.cancers.forEach((cancer: any) => {
                            const type = cancer.cancer_type;
                            const diagnosisAge = cancer.age_at_diagnosis;
                            if (type) {
                                const cancerCode = cancerTypesMap[type];
                                fmh.condition?.push({
                                    code: {
                                        coding: cancerCode ? [{ system: SYSTEM_SNOMED, code: cancerCode, display: type }] : [],
                                        text: type
                                    },
                                    onsetAge: diagnosisAge ? { value: Number(diagnosisAge), unit: "a", system: SYSTEM_UCUM, code: "a" } : undefined
                                });
                            }
                        });
                    } else if (member.cancer_type) {
                         // Handle flattened structure
                         const type = member.cancer_type;
                         const diagnosisAge = member.age_dx || member.age_at_diagnosis;
                         const cancerCode = cancerTypesMap[type];
                         fmh.condition?.push({
                            code: {
                                coding: cancerCode ? [{ system: SYSTEM_SNOMED, code: cancerCode, display: type }] : [],
                                text: type
                            },
                            onsetAge: diagnosisAge ? { value: Number(diagnosisAge), unit: "a", system: SYSTEM_UCUM, code: "a" } : undefined
                        });
                    }

                    // Add side_of_family extension if present
                    if (member.side_of_family) {
                        fmh.extension = fmh.extension || [];
                        fmh.extension.push({
                            url: "http://onkono.com/fhir/StructureDefinition/family-member-side",
                            valueString: member.side_of_family // "Maternal" or "Paternal"
                        });
                    }

                    bundle.entry.push({ resource: fmh });
                });
            }
        } catch (e) {
            console.error("Error parsing family history for FHIR", e);
        }

        // --- 7. Immunizations ---
        const imm = standardized.advanced?.screening_immunization || {};
        // HPV Vaccine
        if (imm['imm.hpv.doses'] && imm['imm.hpv.doses'] !== '0') {
            const hpvImm: FhirImmunization = {
                resourceType: "Immunization",
                id: uuidv4(),
                status: "completed",
                patient: subjectRef,
                vaccineCode: { coding: [{ system: SYSTEM_SNOMED, code: "428570002", display: "HPV vaccine" }] },
                protocolApplied: [{ doseNumberPositiveInt: Number(imm['imm.hpv.doses']) }]
            };
            if (imm['imm.hpv.year_last']) hpvImm.occurrenceDateTime = `${imm['imm.hpv.year_last']}`;
            bundle.entry.push({ resource: hpvImm });
        }

        // Tdap Vaccine
        if (imm['imm.td_tdap.year_last']) {
            bundle.entry.push({
                resource: {
                    resourceType: "Immunization",
                    id: uuidv4(),
                    status: "completed",
                    patient: subjectRef,
                    vaccineCode: { coding: [{ system: SYSTEM_SNOMED, code: "396428003", display: "Tdap" }] },
                    occurrenceDateTime: `${imm['imm.td_tdap.year_last']}`
                } as FhirImmunization
            });
        }

        // Influenza Vaccine
        if (imm['imm.flu.last_season'] === 'Yes') {
            bundle.entry.push({
                resource: {
                    resourceType: "Immunization",
                    id: uuidv4(),
                    status: "completed",
                    patient: subjectRef,
                    vaccineCode: { coding: [{ system: SYSTEM_SNOMED, code: "712610006", display: "Influenza vaccine" }] }
                } as FhirImmunization
            });
        }

        // Pneumococcal Vaccine
        if (imm['imm.pneumo.ever'] === 'Yes') {
            bundle.entry.push({
                resource: {
                    resourceType: "Immunization",
                    id: uuidv4(),
                    status: "completed",
                    patient: subjectRef,
                    vaccineCode: { coding: [{ system: SYSTEM_SNOMED, code: "12866006", display: "Pneumococcal vaccine" }] }
                } as FhirImmunization
            });
        }

        // Zoster Vaccine
        if (imm['imm.zoster.ever'] === 'Yes') {
            bundle.entry.push({
                resource: {
                    resourceType: "Immunization",
                    id: uuidv4(),
                    status: "completed",
                    patient: subjectRef,
                    vaccineCode: { coding: [{ system: SYSTEM_SNOMED, code: "409516000", display: "Zoster vaccine" }] }
                } as FhirImmunization
            });
        }

        // COVID-19 Vaccine
        if (imm['imm.covid.doses'] && Number(imm['imm.covid.doses']) > 0) {
            bundle.entry.push({
                resource: {
                    resourceType: "Immunization",
                    id: uuidv4(),
                    status: "completed",
                    patient: subjectRef,
                    vaccineCode: { coding: [{ system: SYSTEM_SNOMED, code: "840536004", display: "COVID-19 vaccine" }] },
                    protocolApplied: [{ doseNumberPositiveInt: Number(imm['imm.covid.doses']) }]
                } as FhirImmunization
            });
        }

        // --- 8. Procedures (Screenings) ---
        // Colonoscopy
        if (imm['screen.colon.ever'] === 'Yes' || imm['screen.colonoscopy.date']) {
            const colonoscopy: FhirProcedure = {
                resourceType: "Procedure",
                id: uuidv4(),
                status: "completed",
                subject: subjectRef,
                code: { coding: [{ system: SYSTEM_SNOMED, code: "73761001", display: "Colonoscopy" }] },
                performedDateTime: imm['screen.colonoscopy.date'] ? `${imm['screen.colonoscopy.date']}` : undefined
            };
            bundle.entry.push({ resource: colonoscopy });
        }

        // Mammography
        if (imm['screen.mammo.ever'] === 'Yes' || imm['screen.mammography.date']) {
            const mammography: FhirProcedure = {
                resourceType: "Procedure",
                id: uuidv4(),
                status: "completed",
                subject: subjectRef,
                code: { coding: [{ system: SYSTEM_SNOMED, code: "71651007", display: "Mammography" }] },
                performedDateTime: imm['screen.mammography.date'] ? `${imm['screen.mammography.date']}` : undefined
            };
            bundle.entry.push({ resource: mammography });
        }

        // --- 9. Genetics (Conditions) ---
        if (standardized.advanced?.genetics?.genes) {
            standardized.advanced.genetics.genes.forEach((gene: string) => {
                const hgncSymbol = geneticGenesMap[gene] || gene;
                const genCond: FhirCondition = {
                    resourceType: "Condition",
                    id: uuidv4(),
                    subject: subjectRef,
                    code: {
                        coding: [
                            { system: SYSTEM_SNOMED, code: "472986005", display: "Genetic susceptibility to malignant neoplasm" },
                            { system: SYSTEM_HGNC, code: hgncSymbol, display: hgncSymbol }
                        ],
                        text: `Pathogenic variant in ${hgncSymbol}`
                    },
                    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] }
                };
                bundle.entry.push({ resource: genCond });
            });
        }

        // Genetic Test Metadata (Observation)
        if (standardized.advanced?.genetics?.tested && standardized.advanced?.genetics?.type) {
            const types = Array.isArray(standardized.advanced.genetics.type)
                ? standardized.advanced.genetics.type.join(', ')
                : standardized.advanced.genetics.type;

            const genTestObs: FhirObservation = {
                resourceType: "Observation",
                id: uuidv4(),
                status: "final",
                code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.gen.test_type", display: "Genetic Test Type" }] },
                subject: subjectRef,
                valueString: types
            };
            if (standardized.advanced.genetics.year) {
                genTestObs.effectiveDateTime = `${standardized.advanced.genetics.year}`;
            }
            bundle.entry.push({ resource: genTestObs });
        }

        // Genetic Variant Found (Self) - High Level Observation
        if (standardized.advanced?.genetics?.variant_self_status) {
             bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.gen.path_variant_self", display: "Pathogenic Variant found in Self" }] },
                    subject: subjectRef,
                    valueString: standardized.advanced.genetics.variant_self_status // Yes, No, Not sure
                } as FhirObservation
            });
        }

        // Family Reported Genes (onkn.gen.family_genes)
        if (standardized.advanced?.genetics?.family_genes && Array.isArray(standardized.advanced.genetics.family_genes)) {
            standardized.advanced.genetics.family_genes.forEach((gene: string) => {
                 bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: uuidv4(),
                        status: "final",
                        code: { coding: [{ system: SYSTEM_ONKONO, code: "onkn.gen.family_gene", display: "Family Reported Gene Mutation" }] },
                        subject: subjectRef,
                        valueString: gene
                    } as FhirObservation
                });
            });
        }

        // --- 10. Consent (Ephemeral) ---
        const consent: any = {
            resourceType: "Consent",
            id: uuidv4(),
            status: "active",
            scope: {
                coding: [{ system: "http://terminology.hl7.org/CodeSystem/consentscope", code: "patient-privacy", display: "Privacy Consent" }]
            },
            category: [{
                coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "INFAO", display: "access to information" }] // healthcare/care purpose
            }],
            patient: subjectRef,
            dateTime: new Date().toISOString(),
            policy: [{ uri: "http://onkono.com/policies/privacy" }],
            provision: {
                type: "permit",
                purpose: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ActReason", code: "CAREMGT" }]
            }
        };
        bundle.entry.push({ resource: consent });

        // --- 11. Personal Cancer History (Conditions) ---
        if (standardized.advanced?.personal_cancer_history) {
            // The structure might be an array of objects if detailed, or handled via answers if simple. 
            // Based on derived-var usage: const personalCancerHistory = advanced.personal_cancer_history || [];
            // And assessment: it seems to be captured in a custom module? No, assessment-questions shows "personal_cancer_history" as an advanced module with ID "personal_cancer_history". 
            // Usually these modules produce an array of objects if multiple entries allowed, or a single object if fields are flat.
            // Looking at assessment-questions, "personal_cancer_history" module has "cancerTypes" options but doesn't explicitly look like a repeater.
            // However, standard advanced modules usually map to an array in `standardized`.
            // I will assume `standardized.advanced.personal_cancer_history` is an array of objects { cancer_type, year_dx, treatment_types... }
            // BUT wait, in derived variables it does: `const personalCancerHistory = advanced.personal_cancer_history || [];`
            // So I'll treat it as an array.

            const personalHx = Array.isArray(standardized.advanced.personal_cancer_history)
                ? standardized.advanced.personal_cancer_history
                : [];

            personalHx.forEach((item: any) => {
                // item should have cancer_type, year_dx
                if (item.cancer_type) {
                    const code = cancerTypesMap[item.cancer_type];
                    const cond: FhirCondition = {
                        resourceType: "Condition",
                        id: uuidv4(),
                        subject: subjectRef,
                        code: {
                            coding: code
                                ? [{ system: SYSTEM_SNOMED, code: code, display: item.cancer_type }]
                                : [],
                            text: `History of ${item.cancer_type} cancer`
                        },
                        clinicalStatus: {
                            coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "resolved" }]
                        },
                        onsetDateTime: item.year_dx ? `${item.year_dx}` : undefined,
                        extension: []
                    };

                    // Add extensions for clinical flags
                    if (item.genetic_flag) {
                        cond.extension?.push({
                            url: "http://onkono.com/fhir/StructureDefinition/genetic-flag",
                            valueString: String(item.genetic_flag)
                        });
                    }
                    if (item.recurrence_ever) {
                        cond.extension?.push({
                            url: "http://onkono.com/fhir/StructureDefinition/recurrence-ever",
                            valueString: String(item.recurrence_ever)
                        });
                    }
                    if (item.metastatic_ever) {
                        cond.extension?.push({
                            url: "http://onkono.com/fhir/StructureDefinition/metastatic-ever",
                            valueString: String(item.metastatic_ever)
                        });
                    }

                    bundle.entry.push({ resource: cond });
                }

            // Treatments (Chemo, Immuno, Radiotherapy)
            const treatments = item.treatment_types || [];
            
            // Helper for adding medications within this scope
            const addMedication = (code: string, display: string, reason?: string) => {
                 bundle.entry.push({
                    resource: {
                        resourceType: "MedicationStatement",
                        id: uuidv4(),
                        status: "completed",
                        subject: subjectRef,
                        medicationCodeableConcept: {
                            coding: [{ system: SYSTEM_SNOMED, code: code, display: display }]
                        },
                        reasonCode: reason ? [{ text: reason }] : undefined
                    } as FhirMedicationStatement
                 });
            };

            if (Array.isArray(treatments)) {
                if (treatments.includes('Chemotherapy')) {
                    addMedication("367336001", "Chemotherapy", "Cancer treatment");
                }
                if (treatments.includes('Immunotherapy')) {
                     addMedication("708187008", "Immunotherapy", "Cancer treatment");
                }
                if (treatments.includes('Radiotherapy')) {
                    // Create Procedure for Radiotherapy
                     const rtProc: FhirProcedure = {
                        resourceType: "Procedure",
                        id: uuidv4(),
                        status: "completed",
                        subject: subjectRef,
                        code: { coding: [{ system: SYSTEM_SNOMED, code: "108290001", display: "Radiotherapy" }] },
                        reasonReference: [{ reference: `Condition/${uuidv4()}` }] 
                    };
                     if (item.rt_region) {
                         // Simplify: item.rt_region is string[] or string? Interface says string[]. 
                         // Check standardization. If array, join or pick first.
                         const regionText = Array.isArray(item.rt_region) ? item.rt_region.join(', ') : item.rt_region;
                         rtProc.bodySite = [{ coding: [], text: regionText }];
                     }
                     if (item.year_dx) {
                          rtProc.performedDateTime = `${item.year_dx}`;
                     }
                     bundle.entry.push({ resource: rtProc });
                }
                 if (treatments.includes('Hormone Therapy')) {
                    addMedication("367336001", "Hormone Therapy", "Cancer treatment"); 
                }
            }
        }); // Close forEach
    }

        // --- 12. Prophylactic Surgery (Procedures) ---
        // standardized.advanced.prophylactic_surgery is likely an object: { type: ['Mastectomy'], year: 2020 }
        if (standardized.advanced?.prophylactic_surgery) {
            const proph = standardized.advanced.prophylactic_surgery;
            const year = proph.year || proph['ca.prophylactic_surgery.year']; // Handle both flat/nested key styles depending on parser

            // The type might be in 'type' (parsed) or 'ca.prophylactic_surgery.type' (raw keys)
            // Usually standardized keys are cleaner, e.g. just 'type'. I'll check for both array sources.
            const types = proph.type || proph['ca.prophylactic_surgery.type'];

            if (Array.isArray(types)) {
                types.forEach((surgeryType: string) => {
                    let sctCode = "";
                    switch (surgeryType) {
                        case "Mastectomy": sctCode = "172043006"; break; // Total mastectomy 
                        case "Oophorectomy": sctCode = "83152002"; break; // Oophorectomy
                        case "Hysterectomy": sctCode = "236886002"; break; // Hysterectomy
                        case "Salpingectomy": sctCode = "31221008"; break; // Salpingectomy
                        default: sctCode = "392021009"; break; // Procedure (History)
                    }

                    const proc: FhirProcedure = {
                        resourceType: "Procedure",
                        id: uuidv4(),
                        status: "completed",
                        subject: subjectRef,
                        code: {
                            coding: [{ system: SYSTEM_SNOMED, code: sctCode, display: surgeryType }]
                        },
                        reasonCode: [{
                            coding: [{ system: SYSTEM_SNOMED, code: "704295000", display: "Risk reducing surgery" }],
                            text: "risk-reducing"
                        }],
                        performedDateTime: year ? `${year}` : undefined
                    };
                    bundle.entry.push({ resource: proc });
                });
            }
        }

        return bundle;
    }
};
