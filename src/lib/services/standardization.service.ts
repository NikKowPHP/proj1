import { logger } from "@/lib/logger";
import questionnaireData from "@/lib/assessment-questions.json";

// In a real application, these maps would be much larger or externalized
const cancerTypeMap: Record<string, string> = {
  "Breast Cancer": "ICD-O-3:C50.9",
  "Lung Cancer": "ICD-O-3:C34.9",
};

const jobTitleMap: Record<string, string> = {
  "Software Developer": "ISCO-08:2512",
  "Physician": "ISCO-08:2211",
};

/**
 * A service to standardize raw form answers into a structured, coded format.
 */
export const StandardizationService = {
  /**
   * Processes the flat answer object from the form into a structured payload.
   * @param answers - The raw answers from the Zustand store.
   * @returns A structured object with standardized codes and units.
   */
  standardize: (answers: Record<string, string>): Record<string, any> => {
    const standardized: Record<string, any> = {};

    try {
      // Demographics
      standardized.demographics = {
        age_range: answers.age,
        sex_at_birth: answers.sex_at_birth,
        gender_identity: answers.gender_identity,
        language: answers.language,
      };

      // Measurements (Height & Weight)
      const height = parseFloat(answers.height);
      const weight = parseFloat(answers.weight);
      const isMetric = answers.units === "metric";
      
      standardized.measurements = {
        height: {
          value: isMetric ? height : parseFloat((height * 2.54).toFixed(2)),
          unit: "cm",
          code: "8302-2", // LOINC code for Body height
        },
        weight: {
          value: isMetric ? weight : parseFloat((weight * 0.453592).toFixed(2)),
          unit: "kg",
          code: "29463-7", // LOINC code for Body weight
        },
      };

      // Symptoms
      if (answers.symptoms) {
        const selectedSymptomIds = JSON.parse(answers.symptoms);
        const symptomOptions = questionnaireData.steps.find(s => s.questions.some(q => q.id === 'symptoms'))?.questions.find(q => q.id === 'symptoms')?.options || [];
        
        standardized.symptoms = selectedSymptomIds.map((id: string) => {
          const option = symptomOptions.find(o => o.id === id);
          return {
            id: id,
            label: typeof option?.label === 'object' ? option.label.en : option?.label,
            hpo_code: option?.hpo_code,
            details: answers[`symptom_details_${id}`] ? JSON.parse(answers[`symptom_details_${id}`]) : {},
          };
        });
      }

       // Family History
      if (answers.family_history_cancer === 'Yes' && answers.family_cancer_history) {
        standardized.family_history = JSON.parse(answers.family_cancer_history).map((relative: any) => ({
          ...relative,
          cancer_type_code: cancerTypeMap[relative.cancer_type] || "ICD-O-3:UNKNOWN"
        }));
      }

      // Genetics
      if(answers.genetic_testing_done === 'Yes') {
        standardized.genetics = {
          genetic_testing_done: answers.genetic_testing_done,
          genetic_test_type: answers.genetic_test_type,
          genetic_findings: answers.genetic_findings,
          // In a real scenario, findings would be mapped to HGNC/HGVS codes
        }
      }
      
      // ... other sections would be standardized here ...

    } catch (error) {
      logger.error("Failed to standardize answers", {
        error,
        answers,
      });
      // Return a partially standardized object if possible
      return standardized;
    }

    return standardized;
  },
};
