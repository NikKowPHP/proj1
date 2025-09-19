import { logger } from "@/lib/logger";

/**
 * Safely parses a JSON string from an answers object.
 * @param value The value to parse, which might be a JSON string.
 * @returns The parsed object/array, or an empty array if parsing fails.
 */
const safeJsonParse = (value: any): any[] => {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
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
          symptomDetails[symptomId] = safeJsonParse(answers[detailKey]);
        }
      });
      if (Object.keys(symptomDetails).length > 0) {
        standardized.advanced.symptom_details = symptomDetails;
      }
      
      // Family History
      if (answers.family_cancer_history) {
        standardized.advanced.family = safeJsonParse(answers.family_cancer_history);
      }
      
      // Genetics
      if (answers.genetic_testing_done === 'Yes') {
        standardized.advanced.genetics = {
          tested: true,
          type: answers.genetic_test_type,
          year: answers.genetic_test_year,
          findings_present: answers.genetic_findings_present,
          genes: safeJsonParse(answers.genetic_genes),
          vus_present: answers.genetic_vus_present,
        };
      }

      // Illnesses
      const illnessList = safeJsonParse(answers.illness_list);
      if (illnessList.length > 0) {
          standardized.advanced.illnesses = illnessList.map((illnessId: string) => {
              const detailsKey = `illness_details_${illnessId}`;
              const details = answers[detailsKey] ? JSON.parse(answers[detailsKey]) : {};
              return {
                  id: illnessId,
                  ...details
              };
          });
      }

       // Occupational History
      if (answers.occupational_hazards) {
        standardized.advanced.occupational = safeJsonParse(answers.occupational_hazards);
      }

      // Sexual Health
      const sexualHealth: Record<string, any> = {};
      const sexualHealthKeys = ['sex_active', 'sex_partner_gender', 'sex_lifetime_partners', 'sex_last12m_partners', 'sex_barrier_freq', 'sex_sti_history', 'sex_anal', 'sex_oral'];
      sexualHealthKeys.forEach(key => {
        if (answers[key]) {
          if (key === 'sex_partner_gender' || key === 'sex_sti_history') {
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
      const envKeys = ['home_years_here', 'home_postal_coarse', 'home_year_built', 'home_basement', 'home_radon_tested', 'home_radon_value', 'home_radon_unit', 'home_radon_date', 'home_shs_home', 'home_fuels', 'home_kitchen_vent', 'env_major_road', 'env_industry', 'env_agriculture', 'env_outdoor_uv', 'water_source', 'water_well_tested', 'water_well_findings'];
      envKeys.forEach(key => {
         if (answers[key]) {
          if (key === 'home_fuels' || key === 'env_industry' || key === 'water_well_findings') {
            environmental[key] = safeJsonParse(answers[key]);
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
      if(answers.ecog) {
        standardized.advanced.functional_status = {
          ecog: answers.ecog
        }
      }

      // Smoking Details
      if (answers.cigs_per_day || answers.smoking_years) {
        standardized.advanced.smoking_detail = {
          cigs_per_day: Number(answers.cigs_per_day) || undefined,
          years: Number(answers.smoking_years) || undefined,
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
