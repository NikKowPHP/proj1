import { logger } from "@/lib/logger";
import { cancerTypesMap } from "@/lib/mappings/cancer-types.map";
import { jobTitlesMap } from "@/lib/mappings/job-titles.map";
import { medicalConditionsMap } from "@/lib/mappings/medical-conditions.map";
import { occupationalExposuresMap } from "@/lib/mappings/occupational-exposures.map";
import { environmentalExposuresMap } from "@/lib/mappings/environmental-exposures.map";

/**
 * Safely parses a JSON string from an answers object.
 * @param value The value to parse, which might be a JSON string.
 * @returns The parsed object/array, or an empty array if parsing fails.
 */
const safeJsonParse = (value: any): any[] => {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    // Allow parsing objects as well for single entries, but always return array for consistency if it's not one
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
    return [];
  } catch (e) {
    return [];
  }
};

/**
 * A service to standardize raw form answers into a structured, coded format
 * as specified in new_requirements.md.
 */
export const StandardizationService = {
  /**
   * Processes the flat answer object from the form into a structured payload.
   * @param answers - The raw answers from the Zustand store.
   * @returns A structured object with core and advanced sections.
   */
  standardize: (answers: Record<string, any>): Record<string, any> => {
    const standardized: { core: Record<string, any>, advanced: Record<string, any> } = {
      core: {},
      advanced: {},
    };

    try {
      // --- CORE SECTION ---
      standardized.core = {
        dob: answers.dob,
        sex_at_birth: answers.sex_at_birth,
        height_cm: Number(answers.height_cm) || undefined,
        weight_kg: Number(answers.weight_kg) || undefined,
        smoking_status: answers.smoking_status,
        alcohol_status: answers['alcohol.status'],
        alcohol_former_since: Number(answers['alcohol.former_since']) || undefined,
        // Alcohol (AUDIT-C)
        alcohol_audit: {
            q1: Number(answers['auditc.q1_freq']),
            q2: Number(answers['auditc.q2_typical']),
            q3: Number(answers['auditc.q3_6plus']),
        },
        symptoms: safeJsonParse(answers.symptoms),
        family_cancer_any: answers.family_cancer_any,
        // Optional core fields
        intent: answers.intent,
        source: answers.source,
        language: answers.language,
        gender_identity: answers.gender_identity,
        // Diet (WCRF FFQ)
        diet: {
            vegetables: Number(answers['diet.fv_portions_day']),
            red_meat: Number(answers['diet.red_meat_servings_week']), // Old: diet_red_meat
            processed_meat: Number(answers['diet.processed_meat_servings_week']), // Old: diet_processed_meat
            sugary_drinks: Number(answers['diet.ssb_servings_week']),
            whole_grains: Number(answers['diet.whole_grains_servings_day']),
            fast_food: Number(answers['diet.fastfoods_freq_week']),
            legumes: Number(answers['diet.legumes_freq_week']),
            upf_share: answers['diet.upf_share_pct'],
            ssb_container: answers['diet.ssb_container'],
        },
        // Physical Activity (IPAQ)
        physical_activity: {
            vigorous_days: Number(answers['pa.vig.days7']),
            vigorous_min: Number(answers['pa.vig.minperday']),
            moderate_days: Number(answers['pa.mod.days7']),
            moderate_min: Number(answers['pa.mod.minperday']),
            walking_days: Number(answers['pa.walk.days7']),
            walking_min: Number(answers['pa.walk.minperday']), // Old: ipaq_walking_min
            sitting_min: Number(answers['pa.sit.min_day']),
        },
      };

      // --- ADVANCED SECTION ---
      
      // Symptom Details
      const symptomDetails: Record<string, any> = {};
      standardized.core.symptoms.forEach((symptomId: string) => {
        const detailKey = `symptom_details_${symptomId}`;
        if (answers[detailKey]) {
          symptomDetails[symptomId] = safeJsonParse(answers[detailKey]); // Changed to safeJsonParse
        }
      });
      if (Object.keys(symptomDetails).length > 0) {
        standardized.advanced.symptom_details = symptomDetails;
      }
      
      // Family History
      if (answers.family_cancer_history) {
        const familyHistory = safeJsonParse(answers.family_cancer_history);
        standardized.advanced.family = familyHistory.map((member: any) => ({
          ...member,
          cancer_code: cancerTypesMap[member.cancer_type] || undefined,
          // New fields are passed through automatically via spread, but explicitly listed for clarity if needed
        }));
      }
      
      // Genetics
      if (['yes_report', 'yes_no_details'].includes(answers['gen.testing_ever'])) {
        standardized.advanced.genetics = {
          tested: true,
          type: answers.genetic_test_type,
          year: answers.genetic_test_year,
          lab: answers.genetic_lab,
          findings_present: answers['gen.path_variant_self'] === 'yes', // Old logic mapped
          variant_self_status: answers['gen.path_variant_self'],
          genes: answers.genetic_genes ? JSON.parse(answers.genetic_genes) : [],
          variants_hgvs: answers.genetic_variants_hgvs,
          vus_present: answers.genetic_vus_present,
        };
      }
      // PRS
      if (answers['gen.prs_done'] === 'Yes') {
          standardized.advanced.genetics = {
              ...standardized.advanced.genetics,
              prs: {
                  done: true,
                  red_flags: answers['gen.prs_cancers_flagged'] ? (Array.isArray(answers['gen.prs_cancers_flagged']) ? answers['gen.prs_cancers_flagged'] : [answers['gen.prs_cancers_flagged']]) : [],
                  risk_band: answers['gen.prs_overall_band']
              }
          }
      }

      // Illnesses (Mapped from Core cond.summary)
      // cond.summary is likely an array of strings (e.g. ["hbv", "diabetes"]) or a JSON string depending on storage.
      // Usually checkbox groups store as array or stringified array. safeJsonParse handles stringified.
      // If it's already an array, safeJsonParse returns it? safeJsonParse expects string.
      // Let's handle both.
      let illnessList = answers['cond.summary'];
      if (typeof illnessList === 'string') {
          illnessList = safeJsonParse(illnessList);
      } else if (!Array.isArray(illnessList)) {
          illnessList = [];
      }

      if (illnessList.length > 0) {
          standardized.advanced.illnesses = illnessList.map((illnessId: string) => {
              // New Logic: specific fields per illness
              const details: any = {};
              
              if (illnessId === 'hbv') {
                  details.status = answers['cond.hbv.status'];
                  details.antiviral = answers['cond.hbv.antiviral_now'];
              }
              if (illnessId === 'hcv') {
                  details.status = answers['cond.hcv.status'];
                  details.svr12 = answers['cond.hcv.svr12'];
              }
              if (illnessId === 'cirrhosis') details.etiology = answers['cond.cirrhosis.etiology'];
              if (illnessId === 'ibd') {
                  details.type = answers['cond.ibd.type'];
                  details.extent = answers['cond.ibd.extent'];
                  // Need year of diagnosis for duration calculation
                  // Assuming 'illness_details_ibd' might store year if collected via GenericModule or similar
                  // But current JSON uses specific questions.
                  // If year is not collected, duration logic will fail gracefully.
                  // Let's check if we can add year collection for IBD.
                  // For now, mapping what we have.
              }
              if (illnessId === 'diabetes') details.type = answers['cond.diabetes.type'];
              if (illnessId === 'hypertension') details.controlled = answers['cond.hypertension.controlled'];

              return {
                  id: illnessId,
                  code: medicalConditionsMap[illnessId] || undefined,
                  ...details
              };
          });
      }

      // Personal Cancer History
      if (answers.personal_cancer_history) {
        const personalCancerHistory = safeJsonParse(answers.personal_cancer_history);
        standardized.advanced.personal_cancer_history = personalCancerHistory.map((cancer: any) => ({
          ...cancer,
          type_code: cancerTypesMap[cancer.type] || undefined,
        }));
      }

       // Occupational History (Hazard Centric)
      if (answers.occupational_hazards) {
        const occupationalHistory = safeJsonParse(answers.occupational_hazards);
        // Map hazard-centric entries
        standardized.advanced.occupational = occupationalHistory.map((entry: any) => {
          return {
             hazard: entry.hazardId,
             hazard_code: occupationalExposuresMap[entry.hazardId] || undefined,
             job_title: entry.main_job_title,
             isco: jobTitlesMap[entry.main_job_title] || undefined,
             years: entry.years_total,
             hours_week: entry.hours_per_week,
             year_first: entry.year_first_exposed,
             current: entry.current_exposure,
             ppe: entry.ppe_use
          };
        });
      }
      
      // Screening and Immunization
      const screeningImmunization: Record<string, any> = {};
      const screeningKeys = [
          'screen.colonoscopy.done', 'screen.colonoscopy.date', 
          'screen.mammo.done', 'screen.mammo.date', 
          'screen.pap.done', 'screen.pap.date', 
          'screen.psa.done', 'screen.psa.date', 
          'imm.hpv', 'imm.hbv',
          // New Screening
          'screen.lung.ldct_ever', 'screen.lung.ldct_last_year',
          'screen.skin.full_exam_ever', 'screen.skin.last_year',
          'screen.hcc.us_ever', 'screen.hcc.us_last_year',
          'screen.upper_endo.ever', 'screen.upper_endo.last_year',
          'screen.cervix.last_type', 'screen.cervix.last_result', // Added
          // New Immunization
          'imm.hav.any', 'imm.flu.last_season', 'imm.covid.doses',
          'imm.td_tdap.year_last', 'imm.pneumo.ever', 'imm.zoster.ever'
      ];
      screeningKeys.forEach(key => {
        if (answers[key]) {
          screeningImmunization[key] = answers[key];
        }
      });
      if (Object.keys(screeningImmunization).length > 0) {
        standardized.advanced.screening_immunization = screeningImmunization;
      }

      // Medications / Iatrogenic
      const medications: Record<string, any> = {};
      const medicationKeys = ['immunosuppression_now', 'immunosuppression_cause'];
      medicationKeys.forEach(key => {
          if (answers[key]) {
              medications[key] = answers[key];
          }
      });
        if (Object.keys(medications).length > 0) {
        standardized.advanced.medications_iatrogenic = medications;
      }


      // Sexual Health
      const sexualHealth: Record<string, any> = {};
      const sexualHealthKeys = [
          'sexhx.section_opt_in',
          'sex_active', 
          'sexhx.partner_genders', 
          'sexhx.lifetime_partners_cat', // Old: sex_lifetime_partners
          'sexhx.partners_12m_cat', 
          'sexhx.condom_use_12m', // Old: sex_barrier_freq
          'sexhx.sti_history_other', 
          'sex_anal', 
          'sex_oral', 
          'sex_barriers_practices',
          // New
          'sexhx.new_partner_12m',
          'sexhx.age_first_sex',
          'sexhx.sex_sites_ever',
          'sexhx.sex_sites_12m',
          'sexhx.sex_work_ever',
          'sexhx.sex_work_role',
          'sexhx.sti_treated_12m',
          'sexhx.hpv_precancer_history' // Female only
      ];
      sexualHealthKeys.forEach(key => {
        if (answers[key]) {
             if (['sexhx.partner_genders', 'sexhx.sex_sites_ever', 'sexhx.sex_sites_12m', 'sexhx.sex_work_role', 'sexhx.sex_work_ever'].includes(key) && answers[key].startsWith('[')) {
                 sexualHealth[key] = safeJsonParse(answers[key]);
             } else {
                 sexualHealth[key] = answers[key];
             }
        }
      });
      if (Object.keys(sexualHealth).length > 0) {
        standardized.advanced.sexual_health = sexualHealth;
      }

      // Environmental Exposures
      const environmental: Record<string, any> = {};
      const envKeys = [
          'env.summary',
          // Detail fields
          'env.air.high_pollution_years', 'env.industry.type',
          'env.indoor.solidfuel_years', 'env.indoor.ventilation',
          'env.radon.tested', 'env.radon.result', 'env.radon.mitigation_done',
          'env.asbestos.disturbance',
          'env.water.well_tested', 'env.water.arsenic',
          'env.pesticide.type',
          'env.uv.sunbed_freq',
          // Retained/Common fields
          'home_years_here', 'home_postal_coarse', 'home_year_built', 'home_basement',
          'home_shs_home', 'env_outdoor_uv', 'env.uv.sunburn_child', 'env.uv.sunburn_adult'
      ];
      
      envKeys.forEach(key => {
          if (answers[key]) {
              environmental[key] = answers[key];
          }
      });

      // Map environmental summary to codes
      if (answers['env.summary']) {
          const envList = safeJsonParse(answers['env.summary']);
          environmental.coded_exposures = envList.map((id: string) => ({
              id: id,
              code: environmentalExposuresMap[id] || undefined
          })).filter((item: any) => item.id !== 'none');
      }

      if (Object.keys(environmental).length > 0) {
        standardized.advanced.environmental = environmental;
      }
      envKeys.forEach(key => {
         if (answers[key]) {
           environmental[key] = answers[key];
        }
      });
       if (Object.keys(environmental).length > 0) {
        standardized.advanced.environment = environmental;
      }

      // Labs & Imaging
      if (answers.labs_and_imaging) {
        standardized.advanced.labs_imaging = safeJsonParse(answers.labs_and_imaging);
      }
      
      // Functional Status
      const functionalStatus: Record<string, any> = {};
      if (answers.ecog) {
        functionalStatus.ecog = answers.ecog;
      }
      if (answers.qlq_c30_consent === 'true') {
        functionalStatus.qlq_c30_consent = true;
      }
      for (const key in answers) {
        if (key.startsWith('qlq_c30_item_')) {
          functionalStatus[key] = answers[key];
        }
      }
      if (Object.keys(functionalStatus).length > 0) {
        standardized.advanced.functional_status = functionalStatus;
      }

      // Smoking Details
      // Consolidating new logic
      const smokingDetails: any = {
          pattern: answers['smoking.pattern'],
          start_age: Number(answers['smoking.start_age']) || undefined,
          cigs_per_day: Number(answers['smoking.intensity']) || undefined,
          intensity_unit: answers['smoking.intensity_unit'],
          years: Number(answers['smoking.years_smoked']) || undefined,
          quit_date: answers['smoking.quit_date'], // Updated key
          other_tobacco: answers['smoking.other_tobacco_smoked'],
          cigars_week: Number(answers['smoking.other_cigar_per_week']) || undefined,
          pipe_week: Number(answers['smoking.pipe_per_week']) || undefined,
          shisha_week: Number(answers['smoking.shisha_per_week']) || undefined,
          vape: {
              status: answers['vape.status'],
              days_30d: Number(answers['vape.days_30d']) || undefined,
              device: answers['vape.device_type'],
              nicotine: answers['vape.nicotine'],
          },
          htp: {
              status: answers['htp.status'],
              days_30d: Number(answers['htp.days_30d']) || undefined,
              sticks_day: Number(answers['htp.sticks_per_day']) || undefined,
          },
          shs: {
              home_freq: answers['shs.home_freq'],
              work_freq: answers['shs.work_freq'],
              public_30d: answers['shs.public_30d_bars'],
              hours_7d: Number(answers['shs.hours_7d']) || undefined,
          }
      };

      // Clean undefined
      const cleanObject = (obj: any): any => {
         Object.keys(obj).forEach(key => {
             if (obj[key] && typeof obj[key] === 'object') cleanObject(obj[key]);
             else if (obj[key] === undefined) delete obj[key];
         });
         return obj;
      };
      
      // Update alcohol with beverage mix
      if (answers['alcohol.beverage_mix']) {
          standardized.core.alcohol_beverage_mix = answers['alcohol.beverage_mix'];
      }

      standardized.advanced.smoking_detail = cleanObject(smokingDetails);

    } catch (error) {
      logger.error("Failed to standardize answers", {
        error,
        answers,
      });
    }

    return standardized;
  },

  /**
   * Converts the standardized data into a FHIR Bundle.
   * @param standardizedData - The output from standardize().
   * @returns A FHIR Bundle resource.
   */
  toFhir: (standardizedData: Record<string, any>): Record<string, any> => {
      const bundle: Record<string, any> = {
          resourceType: "Bundle",
          type: "collection",
          entry: []
      };

      try {
          const core = standardizedData.core || {};
          const advanced = standardizedData.advanced || {};
          const patientId = "patient-001"; // Placeholder

          // 1. Patient Resource
          bundle.entry.push({
              resource: {
                  resourceType: "Patient",
                  id: patientId,
                  birthDate: core.dob,
                  gender: core.sex_at_birth === 'Male' ? 'male' : (core.sex_at_birth === 'Female' ? 'female' : 'other'),
                  ...(core.height_cm && core.weight_kg ? {
                      // Extensions could go here
                  } : {})
              }
          });

          // 2. Observations (Vital Signs / Biometrics)
          if (core.height_cm) {
              bundle.entry.push({
                  resource: {
                      resourceType: "Observation",
                      status: "final",
                      code: { coding: [{ system: "http://loinc.org", code: "8302-2", display: "Body height" }] },
                      subject: { reference: `Patient/${patientId}` },
                      valueQuantity: { value: core.height_cm, unit: "cm", system: "http://unitsofmeasure.org", code: "cm" }
                  }
              });
          }
           if (core.weight_kg) {
              bundle.entry.push({
                  resource: {
                      resourceType: "Observation",
                      status: "final",
                      code: { coding: [{ system: "http://loinc.org", code: "29463-7", display: "Body weight" }] },
                      subject: { reference: `Patient/${patientId}` },
                      valueQuantity: { value: core.weight_kg, unit: "kg", system: "http://unitsofmeasure.org", code: "kg" }
                  }
              });
          }

          // 3. Observations (Social History)
          if (core.smoking_status) {
              bundle.entry.push({
                  resource: {
                      resourceType: "Observation",
                      status: "final",
                      code: { coding: [{ system: "http://loinc.org", code: "72166-2", display: "Tobacco smoking status" }] },
                      subject: { reference: `Patient/${patientId}` },
                      valueCodeableConcept: { text: core.smoking_status }
                  }
              });
          }
          
          // 4. Family Member History
           if (advanced.family && Array.isArray(advanced.family)) {
               advanced.family.forEach((member: any, index: number) => {
                   bundle.entry.push({
                       resource: {
                           resourceType: "FamilyMemberHistory",
                           id: `family-${index}`,
                           status: "completed",
                           patient: { reference: `Patient/${patientId}` },
                           relationship: { text: member.relation },
                           condition: [
                               {
                                   code: { text: member.cancer_type },
                                   onsetAge: { value: member.age_dx, unit: "a", system: "http://unitsofmeasure.org", code: "a" }
                               }
                           ]
                       }
                   });
               });
           }

          // 5. Conditions (Personal History)
          if (advanced.personal_cancer_history && Array.isArray(advanced.personal_cancer_history)) {
              advanced.personal_cancer_history.forEach((cancer: any, index: number) => {
                   bundle.entry.push({
                       resource: {
                           resourceType: "Condition",
                           id: `history-cancer-${index}`,
                           clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] }, // Assuming active history
                           verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
                           category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "problem-list-item" }] }],
                           code: { text: cancer.type },
                           subject: { reference: `Patient/${patientId}` },
                           onsetDateTime: cancer.year_dx ? `${cancer.year_dx}` : undefined
                       }
                   });
              });
          }


      } catch (error) {
           logger.error("Failed to map to FHIR", { error });
      }

      return bundle;
  }
};
      