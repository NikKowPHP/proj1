import { logger } from "@/lib/logger";
import { differenceInYears } from 'date-fns';

/**
 * Calculates Body Mass Index (BMI).
 * @param height - Height in cm.
 * @param weight - Weight in kg.
 * @returns The calculated BMI, or null if inputs are invalid.
 */
function calculateBmi(height?: number, weight?: number): number | null {
  if (!height || !weight || height <= 0 || weight <= 0) {
    return null;
  }
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
}

/**
 * Calculates age from a date of birth string.
 * @param dob - Date of birth in "YYYY-MM-DD" format.
 * @returns The calculated age in years, or null if the input is invalid.
 */
function calculateAge(dob?: string): number | null {
    if (!dob) return null;
    try {
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return null;
        return differenceInYears(new Date(), birthDate);
    } catch {
        return null;
    }
}

/**
 * Calculates smoking pack-years.
 * @param smokingDetails - Object with cigs_per_day and years.
 * @returns The calculated pack-years, or null if inputs are invalid.
 */
function calculatePackYears(smokingDetails?: { cigs_per_day?: number; years?: number }): number | null {
    if (!smokingDetails || !smokingDetails.cigs_per_day || !smokingDetails.years) {
        return null;
    }
    const { cigs_per_day, years } = smokingDetails;
    if (cigs_per_day <= 0 || years <= 0) return null;
    
    return parseFloat(((cigs_per_day / 20) * years).toFixed(1));
}

/**
 * Checks for early-age cancer diagnosis in first-degree relatives.
 * @param familyHistory - Array of family member health history.
 * @returns `true` if an early diagnosis is found, `false` otherwise, or `null` if no relevant data.
 */
function calculateEarlyAgeFamilyDx(familyHistory?: { relation?: string; age_dx?: number }[]): boolean | null {
    if (!familyHistory || !Array.isArray(familyHistory) || familyHistory.length === 0) {
        return null;
    }

    const firstDegreeRelatives = ['Parent', 'Sibling', 'Child'];

    const hasEarlyDx = familyHistory.some(
        (relative) =>
            relative.relation &&
            firstDegreeRelatives.includes(relative.relation) &&
            relative.age_dx &&
            relative.age_dx < 50
    );
    
    return hasEarlyDx;
}

/**
 * Calculates composite flags for occupational exposures.
 * @param occupationalHistory - Array of jobs with exposures.
 * @returns An object with exposure flags, or null if no data.
 */
function calculateExposureComposites(occupationalHistory?: { occ_exposures?: string[] }[]): { has_known_carcinogen_exposure: boolean } | null {
    if (!occupationalHistory || !Array.isArray(occupationalHistory) || occupationalHistory.length === 0) {
        return null;
    }

    const highRiskExposures = ['asbestos', 'benzene'];
    const allExposures = new Set(occupationalHistory.flatMap(job => job.occ_exposures || []));

    const hasExposure = highRiskExposures.some(risk => allExposures.has(risk));
    
    return { has_known_carcinogen_exposure: hasExposure };
}


/**
 * A service to calculate derived health variables from standardized user data.
 */
export const DerivedVariablesService = {
  /**
   * Calculates all derivable variables from a standardized data object.
   * @param standardizedData - A structured object from the StandardizationService.
   * @returns An object containing the derived variables.
   */
  calculateAll: (standardizedData: Record<string, any>): Record<string, any> => {
    const derived: Record<string, any> = {};

    try {
      const core = standardizedData.core || {};
      const advanced = standardizedData.advanced || {};

      // Calculate Age
      const age = calculateAge(core.dob);
      if (age !== null) {
          derived.age_years = age;
      }

      // Calculate BMI
      const bmi = calculateBmi(core.height_cm, core.weight_kg);
      if (bmi) {
        derived.bmi = {
          value: bmi,
          unit: "kg/m2",
          code: "39156-5", // LOINC code for BMI
        };
      }

      // Calculate pack-years
      if (core.smoking_status === 'Never') {
          derived.pack_years = 0;
      } else if (core.smoking_status === 'Former' || core.smoking_status === 'Current') {
        const packYears = calculatePackYears(advanced.smoking_detail);
        if (packYears !== null) {
            derived.pack_years = packYears;
        }
      }
      
      // Determine organ inventory based on sex at birth.
      // NOTE: This is a baseline. The spec suggests refining this based on surgical history (e.g., hysterectomy).
      // This would require adding questions about organ removal to the questionnaire.
      if(core.sex_at_birth === 'Female') {
          derived.organ_inventory = {
              has_cervix: true,
              has_uterus: true,
              has_ovaries: true,
              has_breasts: true
          }
      } else if (core.sex_at_birth === 'Male') {
          derived.organ_inventory = {
              has_prostate: true,
              has_breasts: true // Men can also get breast cancer
          }
      }

      // Check for early-age family cancer diagnosis
      const earlyDx = calculateEarlyAgeFamilyDx(advanced.family);
      if (earlyDx !== null) {
          derived.early_age_family_dx = earlyDx;
      }

      // Check for high-risk occupational exposures
      const exposures = calculateExposureComposites(advanced.occupational);
      if (exposures !== null) {
          derived.exposure_composites = exposures;
      }

    } catch (error) {
      logger.error("Failed to calculate derived variables", {
          error,
          standardizedData
      });
    }

    return derived;
  },
};
      