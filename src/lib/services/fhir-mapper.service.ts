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
                        : [{ system: SYSTEM_SNOMED, code: symptomId }] // Fallback if mapped to SNOMED
                },
                clinicalStatus: { 
                    coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] 
                },
                verificationStatus: {
                    coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "provisional" }] 
                }
            };
            
            // Add onset year if available
            if (details?.onset_year) {
                condition.onsetDateTime = `${details.onset_year}`;
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
                        { system: SYSTEM_ONKONO, code: "onkn.screen.psa.abnormal", display: "PSA Elevated Flag" }
                    ]
                },
                subject: subjectRef,
                valueBoolean: screening['screen.prostate.psa_abnormal'] === 'Yes' || screening['screen.prostate.psa_abnormal'] === true
            } as FhirObservation
        });
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
            bundle.entry.push({
                resource: {
                    resourceType: "Observation",
                    id: uuidv4(),
                    status: "final",
                    code: { 
                        coding: [
                            { system: SYSTEM_ONKONO, code: `onkn.flag.${key}`, display: key.replace(/_/g, ' ').replace(/\./g, ' ') }
                        ]
                    },
                    subject: subjectRef,
                    valueBoolean: value
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
                            { system: SYSTEM_ONKONO, code: `onkn.derived.${key}`, display: key.replace(/_/g, ' ').replace(/\./g, ' ') }
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
                            { system: SYSTEM_ONKONO, code: `onkn.derived.${key}`, display: key.replace(/_/g, ' ').replace(/\./g, ' ') }
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
    if (standardized.advanced?.family) {
      standardized.advanced.family.forEach((member: any) => {
        const fmh: FhirFamilyMemberHistory = {
          resourceType: "FamilyMemberHistory",
          id: uuidv4(),
          status: "completed",
          patient: subjectRef,
          relationship: { text: member.relation, coding: [] }, // In full impl, map relationship to v3-RoleCode
          condition: []
        };

        if (member.cancer_type) {
            const cancerCode = cancerTypesMap[member.cancer_type];
            fmh.condition?.push({
                code: {
                    coding: cancerCode ? [{ system: SYSTEM_SNOMED, code: cancerCode, display: member.cancer_type }] : [],
                    text: member.cancer_type
                },
                onsetAge: member.age_dx ? { value: Number(member.age_dx), unit: "a", system: SYSTEM_UCUM, code: "a" } : undefined
            });
        }
        bundle.entry.push({ resource: fmh });
      });
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

    return bundle;
  }
};
