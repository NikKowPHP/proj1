import { logger } from "@/lib/logger";

/**
 * Calculates Body Mass Index (BMI).
 * @param height - Height in cm.
 * @param weight - Weight in kg.
 * @returns The calculated BMI, or null if inputs are invalid.
 */
function calculateBmi(height: number, weight: number): number | null {
  if (height <= 0 || weight <= 0) {
    return null;
  }
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
}

/**
 * A service to calculate derived health variables from user answers.
 */
export const DerivedVariablesService = {
  /**
   * Calculates all derivable variables from a set of answers.
   * @param answers - A record of standardized user answers.
   * @returns An object containing the derived variables.
   */
  calculateAll: (answers: Record<string, any>): Record<string, any> => {
    const derived: Record<string, any> = {};

    try {
      // Calculate BMI
      if (answers.measurements?.height?.value && answers.measurements?.weight?.value) {
        const heightCm = answers.measurements.height.value;
        const weightKg = answers.measurements.weight.value;
        const bmi = calculateBmi(heightCm, weightKg);
        if (bmi) {
          derived.bmi = {
            value: bmi,
            unit: "kg/m2",
            code: "39156-5", // LOINC code for BMI
          };
        }
      }

      // Placeholder for pack-years calculation
      if (answers.smoking?.status === 'Current smoker' || answers.smoking?.status === 'Former smoker') {
        derived.pack_years = {
          value: 20, // Placeholder value
          description: "Calculated placeholder pack-years."
        };
      }
      
      // Placeholder for organ inventory
      if(answers.demographics?.sex_at_birth === 'Female') {
          derived.organ_inventory = {
              has_cervix: true, // Placeholder
              has_uterus: true, // Placeholder
          }
      }

    } catch (error) {
      logger.error("Failed to calculate derived variables", error);
    }

    return derived;
  },
};
