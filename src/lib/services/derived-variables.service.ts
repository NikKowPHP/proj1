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
 * Calculates AUDIT-C Score (Alcohol).
 * @param answers - Object with q1, q2, q3 values (0-4).
 * @returns Object with score and risk category.
 */
function calculateAuditC(answers?: { q1?: number, q2?: number, q3?: number }, sex?: string): { score: number, risk: string } | null {
    if (!answers || answers.q1 === undefined || answers.q2 === undefined || answers.q3 === undefined) return null;
    const score = (answers.q1 || 0) + (answers.q2 || 0) + (answers.q3 || 0);
    const threshold = sex === 'Female' ? 3 : 4;
    const risk = score >= threshold ? 'Hazardous' : 'Low Risk';
    return { score, risk };
}

/**
 * Calculates IPAQ Physical Activity Score.
 * @param data - Object with days/minutes for vigorous, moderate, walking.
 * @returns Object with MET-minutes and Category (Low, Moderate, High).
 */
function calculateIpaq(data?: any): { metMinutes: number, category: string } | null {
    if (!data) return null;
    
    // Ensure all inputs are numbers, default to 0 if missing/NaN
    const vigDays = Number(data.vigorous_days) || 0;
    const vigMin = Number(data.vigorous_min) || 0;
    const modDays = Number(data.moderate_days) || 0;
    const modMin = Number(data.moderate_min) || 0;
    const walkDays = Number(data.walking_days) || 0;
    const walkMin = Number(data.walking_min) || 0;

    const vigMets = 8.0 * vigMin * vigDays;
    const modMets = 4.0 * modMin * modDays;
    const walkMets = 3.3 * walkMin * walkDays;
    
    const totalMetMinutes = vigMets + modMets + walkMets;
    const totalDays = vigDays + modDays + walkDays;

    let category = 'Low';

    // Criteria for High
    if ((vigDays >= 3 && totalMetMinutes >= 1500) || (totalDays >= 7 && totalMetMinutes >= 3000)) {
        category = 'High';
    } 
    // Criteria for Moderate
    else if (
        (vigDays >= 3 && vigMin >= 20) || 
        (modDays >= 5 && modMin >= 30) || 
        (walkDays >= 5 && walkMin >= 30) || // Walking is usually included in moderate 5 days rule if duration is sufficient (~30min)
        (totalDays >= 5 && totalMetMinutes >= 600)
    ) {
        category = 'Moderate';
    }

    return { metMinutes: Math.round(totalMetMinutes), category };
}

/**
 * Calculates WCRF Dietary/Lifestyle Compliance Score (Simplified).
 * @param diet - Diet answers.
 * @param alcoholScore - AUDIT-C score.
 * @param bmi - BMI value.
 * @param ipaqCategory - Physical activity category.
 */
function calculateWcrf(diet?: any, alcoholScore?: number, bmi?: number, ipaqCategory?: string): { score: number, max: number, compliance: string } | null {
    if (!diet) return null;
    
    let score = 0;
    let max = 4; // Diet (1), Alcohol (1), Body Fat (1), Activity (1)

    // 1. Plant Foods (Fruit/Veg >= 3 servings is pretty good, 5 is best)
    // Values: 0 (<1), 1 (1-2), 3 (3-4), 5 (5+)
    if ((diet.vegetables || 0) >= 5) score += 1;
    else if ((diet.vegetables || 0) >= 3) score += 0.5;

    // 2. Animal Foods (Red Meat < 3 times/week or < 500g/week approx 3-5 servings)
    // Diet is now servings/week (0-20)
    // Guideline: Moderate amounts of red meat and little/no processed meat
    const redMeatServings = diet.red_meat || 0;
    const processedMeatServings = diet.processed_meat || 0;

    // Logic: Red Meat <= 3 servings (approx 350-500g) is good, Processed Meat < 1 (basically minimal)
    if (processedMeatServings <= 1 && redMeatServings <= 3) score += 1;
    else if (processedMeatServings <= 1 || redMeatServings <= 3) score += 0.5;

    // 3. Alcohol
    if (alcoholScore !== undefined) {
        if (alcoholScore < 3) score += 1; // Assuming <3 is low risk/low consumption
        else if (alcoholScore < 5) score += 0.5;
    }

    // 4. Body Fatness / Activity
    // Use BMI and IPAQ
    if (bmi && bmi >= 18.5 && bmi < 25) score += 0.5;
    if (ipaqCategory === 'High' || ipaqCategory === 'Moderate') score += 0.5;

    return { 
        score, 
        max, 
        compliance: score >= 3 ? 'High' : (score >= 2 ? 'Moderate' : 'Low') 
    };
}

/**
 * Checks for hereditary cancer syndromes (Lynch, HBOC).
 * Simplified pattern matching.
 */
function calculateFamilySyndromes(familyHistory?: any[]): string[] {
    const syndromes: string[] = [];
    if (!familyHistory || !Array.isArray(familyHistory)) return syndromes;

    const lynchCancers = ['colorectal', 'endometrial', 'ovarian', 'stomach', 'pancreatic', 'biliary', 'urinary', 'brain', 'skin']; // approximations
    const hbocCancers = ['breast', 'ovarian', 'pancreatic', 'prostate'];

    // Convert to easier format
    const relatives = familyHistory.map(f => ({
        relation: f.relation,
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx
    }));

    // Check Lynch: 3+ relatives with Lynch cancers, at least one < 50
    const lynchMatches = relatives.filter(r => lynchCancers.some(c => r.cancer.includes(c)));
    const lynchYoung = lynchMatches.some(r => r.age && r.age < 50);
    if (lynchMatches.length >= 3 && lynchYoung) {
        syndromes.push('Potential Lynch Syndrome');
    }

    // Check HBOC: 
    // 1. Breast cancer < 45
    // 2. 3+ relatives with breast/ovarian
    // 3. Male breast cancer
    const breastOvarianMatches = relatives.filter(r => hbocCancers.some(c => r.cancer.includes(c)));
    const breastYoung = relatives.some(r => r.cancer.includes('breast') && r.age && r.age <= 45);
    const maleBreast = relatives.some(r => r.cancer.includes('breast') && (r.relation === 'Father' || r.relation === 'Brother')); // Approximate gender check from relation

    if (breastYoung || breastOvarianMatches.length >= 3 || maleBreast) {
        syndromes.push('Potential HBOC');
    }

    return syndromes;
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
          // Adult Gate
          derived.adult_gate_ok = age >= 18;
          
          // Age Map
          if (age >= 18 && age <= 39) derived.age_band = "18-39";
          else if (age >= 40 && age <= 49) derived.age_band = "40-49";
          else if (age >= 50 && age <= 59) derived.age_band = "50-59";
          else if (age >= 60 && age <= 69) derived.age_band = "60-69";
          else if (age >= 70) derived.age_band = "70+";
      } else {
          derived.adult_gate_ok = false; // Block if age calculation fails
      }

      // Calculate BMI
      const bmi = calculateBmi(core.height_cm, core.weight_kg);
      if (bmi) {
        derived.bmi = {
          value: bmi,
          unit: "kg/m2",
          code: "39156-5", // LOINC code for BMI
        };
        derived.flags = derived.flags || {};
        derived.flags.bmi_obesity = bmi >= 30;
      }
      
      // Diet Calcs
      // PDF Rule: Red Meat * 100, Processed Meat * 50
      if (typeof core.diet?.red_meat === 'number') {
          derived.red_meat_gwk = core.diet.red_meat * 100;
      }
      if (typeof core.diet?.processed_meat === 'number') {
          derived.proc_meat_gwk = core.diet.processed_meat * 50;
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

      // --- New Logic ---

      // AUDIT-C
      const audit = calculateAuditC(core.alcohol_audit, core.sex_at_birth);
      if (audit) derived.alcohol_audit = audit;

      // IPAQ
      const ipaq = calculateIpaq(core.physical_activity);
      if (ipaq) derived.physical_activity_ipaq = ipaq;

      // WCRF
      // Update WCRF to use grams/week derived variables if possible, or mapping
      // Standard WCRF: Red meat < 500g/week (approx 5 servings), Processed meat little/none
      // We pass the raw servings/week to calculateWcrf which we will update locally here or in the helper
      // Helper calculateWcrf uses raw 'diet' object. Let's update that object passed to match helper expectations or update helper.
      // The helper 'calculateWcrf' currently expects `metrics value` (0-5 scale logic from previous code).
      // We should update `calculateWcrf` function above to handle the real numeric inputs. 
      // BUT `calculateWcrf` is defined above in this file. I need to update it too.
      // For now, I'm just calling it. I should update `calculateWcrf` via separate replacement or try to bundle.
      // I'll stick to replacing `DerivedVariablesService` block here and will do a separate update for `calculateWcrf` if needed.
      // Actually, I can bundle the update to `calculateWcrf` in a multi-replace or just assume I'll fix it next.
      // I'll fix it next to be safe.
      const wcrf = calculateWcrf(core.diet, audit?.score, bmi || undefined, ipaq?.category);
      if (wcrf) derived.wcrf_score = wcrf;

      // Family Syndromes
      const syndromes = calculateFamilySyndromes(advanced.family);
      if (syndromes.length > 0) derived.hereditary_syndromes = syndromes;

    } catch (error) {
      logger.error("Failed to calculate derived variables", {
          error,
          standardizedData
      });
    }

    return derived;
  },
};
      