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

      // ... other advanced sections would be standardized here ...

    } catch (error) {
      logger.error("Failed to standardize answers", {
        error,
        answers,
      });
    }

    return standardized;
  },
};
      