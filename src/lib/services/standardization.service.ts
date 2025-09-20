import { logger } from "@/lib/logger";
import { cancerTypesMap } from "@/lib/mappings/cancer-types.map";
import { jobTitlesMap } from "@/lib/mappings/job-titles.map";
import { medicalConditionsMap } from "@/lib/mappings/medical-conditions.map";
import { occupationalExposuresMap } from "@/lib/mappings/occupational-exposures.map";

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
        alcohol_use: answers.alcohol_use,
        symptoms: safeJsonParse(answers.symptoms),
        family_cancer_any: answers.family_cancer_any,
        // Optional core fields
        intent: answers.intent,
        source: answers.source,
        language: answers.language,
        gender_identity: answers.gender_identity,
        diet_pattern: answers.diet_pattern,
        activity_level: answers.activity_level,
      };

      // --- ADVANCED SECTION ---
      
      // Symptom Details
      const symptomDetails: Record<string, any> = {};
      standardized.core.symptoms.forEach((symptomId: string) => {
        const detailKey = `symptom_details_${symptomId}`;
        if (answers[detailKey]) {
          symptomDetails[symptomId] = JSON.parse(answers[detailKey]);
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
        }));
      }
      
      // Genetics
      if (answers.genetic_testing_done === 'Yes') {
        standardized.advanced.genetics = {
          tested: true,
          type: answers.genetic_test_type,
          year: answers.genetic_test_year,
          lab: answers.genetic_lab,
          findings_present: answers.genetic_findings_present,
          genes: answers.genetic_genes ? JSON.parse(answers.genetic_genes) : [],
          variants_hgvs: answers.genetic_variants_hgvs,
          vus_present: answers.genetic_vus_present,
        };
      }

      // Illnesses
      const illnessList = safeJsonParse(answers.illness_list);
      if (Array.isArray(illnessList) && illnessList.length > 0) {
          standardized.advanced.illnesses = illnessList.map((illnessId: string) => {
              const detailsKey = `illness_details_${illnessId}`;
              const details = answers[detailsKey] ? JSON.parse(answers[detailsKey]) : {};
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

       // Occupational History
      if (answers.occupational_hazards) {
        const occupationalHistory = safeJsonParse(answers.occupational_hazards);
        standardized.advanced.occupational = occupationalHistory.map((job: any) => {
          const exposures = job.occ_exposures || [];
          return {
            ...job,
            isco: jobTitlesMap[job.job_title] || undefined,
            occ_exposures_coded: exposures.map((exp: string) => ({
              id: exp,
              code: occupationalExposuresMap[exp] || undefined,
            })),
          };
        });
      }
      
      // Screening and Immunization
      const screeningImmunization: Record<string, any> = {};
      const screeningKeys = ['screen.colonoscopy.done', 'screen.colonoscopy.date', 'screen.mammo.done', 'screen.mammo.date', 'screen.pap.done', 'screen.pap.date', 'screen.psa.done', 'screen.psa.date', 'imm.hpv', 'imm.hbv'];
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
      const sexualHealthKeys = ['sex_active', 'sex_partner_gender', 'sex_lifetime_partners', 'sex_last12m_partners', 'sex_barrier_freq', 'sex_sti_history', 'sex_anal', 'sex_oral', 'sex_barriers_practices'];
      sexualHealthKeys.forEach(key => {
        if (answers[key]) {
          if (key === 'sex_partner_gender' || key === 'sex_sti_history') {
             sexualHealth[key] = answers[key]; // Already an array from form
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
      const envKeys = ['home_years_here', 'home_postal_coarse', 'home_year_built', 'home_basement', 'home_radon_tested', 'home_radon_value', 'home_radon_unit', 'home_radon_date', 'home_shs_home', 'home_fuels', 'home_kitchen_vent', 'env_major_road', 'env_industry', 'env_agriculture', 'env_outdoor_uv', 'water_source', 'water_well_tested', 'water_well_findings', 'env_wildfire_smoke'];
      envKeys.forEach(key => {
         if (answers[key]) {
          if (key === 'home_fuels' || key === 'env_industry' || key === 'water_well_findings') {
            environmental[key] = answers[key]; // Already an array from form
          } else {
            environmental[key] = answers[key];
          }
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
      if (answers.cigs_per_day || answers.smoking_years || answers.quit_year) {
        standardized.advanced.smoking_detail = {
          cigs_per_day: Number(answers.cigs_per_day) || undefined,
          years: Number(answers.smoking_years) || undefined,
          quit_year: Number(answers.quit_year) || undefined,
        };
      }


    } catch (error) {
      logger.error("Failed to standardize answers", {
        error,
        answers,
      });
    }

    return standardized;
  },
};
