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

    const firstDegreeRelatives = ['Parent', 'Sibling', 'Child', 'Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son'];

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
 * Calculates WCRF Dietary/Lifestyle Compliance Score (Detailed).
 * strict thresholds based on PDF requirements.
 */
function calculateWcrf(
    diet: any, 
    alcoholScore: number | undefined, 
    bmi: number | null, 
    ipaqCategory: string | undefined
): { score: number, max: number, compliance: string, components: any } | null {
    if (!diet) return null;
    
    // Components
    let compA = 0; // Plant Foods
    let compB = 0; // Animal Foods
    let compC = 0; // Energy Dense
    let compD = 0; // Body Composition

    // --- Component A: Plant Foods (Max 1.0) ---
    // Rule: FV >= 5 AND (WholeGrains >= 3 OR Legumes >= 1) -> 1.0
    // Sub-optimal: FV >= 5 -> 0.5
    // Else 0
    const fv = diet.fv_portions_day || 0;
    const wg = diet.whole_grains_servings_day || 0;
    const legumes = diet.legumes_freq_week || 0; // Note: input is freq/week, rule often implies daily/servings. 
    // Assuming Legumes >= 1 means once a week here as per standard questionnaire phrasing? 
    // PDF says "Legumes/Pulses >= 1 serving/day" usually.
    // If input is freq_week, 1/day = 7/week.
    // Let's assume strict daily implied:
    const legumesDaily = legumes / 7;

    if (fv >= 5 && (wg >= 3 || legumesDaily >= 1)) {
        compA = 1.0;
    } else if (fv >= 5 || (wg >= 3 || legumesDaily >= 1)) {
        compA = 0.5;
    }

    // --- Component B: Animal Foods (Max 1.0) ---
    // Rule: Red Meat < 500g/week AND Processed Meat == 0 -> 1.0
    // Rule: Red Meat < 500g/week AND Processed Meat > 0 -> 0.5
    // Rule: Exceed limits -> 0
    // Inputs: red_meat (servings/week), processed_meat (servings/week)
    // Conversions: Red ~ 100g/serving, Proc ~ 50g/serving
    const redMeatGwk = (diet.diet_red_meat || diet.red_meat_servings_week || 0) * 100;
    const procMeatGwk = (diet.diet_processed_meat || diet.processed_meat_servings_week || 0) * 50;

    if (redMeatGwk < 500 && procMeatGwk === 0) {
        compB = 1.0;
    } else if (redMeatGwk < 500) {
        compB = 0.5; // Penalty for having processed meat but red meat is ok
    } 
    // If red meat >= 500, score is 0 regardless of processed meat

    // --- Component C: Energy Dense (Max 1.0) ---
    // Rule: NO sugary drinks AND Fast Food < 1/week -> 1.0
    // Rule: Sugary drinks > 0 OR Fast Food >= 1/week -> 0.5? 
    // Strict WCRF usually: Avoid sugary drinks. Limit fast food.
    // Let's model:
    // 1.0 = SSB == 0 AND FastFood < 1
    // 0.5 = SSB <= 1/week AND FastFood < 2??
    // Simplified PDF Logic: 
    // "Low SSB & Low Fast Food" -> 1.0
    const fastFoodFreq = diet.fastfoods_freq_week || 0;
    // SSB: we might need volume but let's look at servings first
    const ssbFreq = diet.ssb_servings_week || 0;

    if (ssbFreq === 0 && fastFoodFreq < 1) {
        compC = 1.0;
    } else if (ssbFreq <= 2 && fastFoodFreq < 2) {
         compC = 0.5;
    }

    // --- Component D: Body Composition & Activity (Max 1.0) ---
    // Split: 0.5 for BMI, 0.5 for Activity? Or 1.0 combined?
    // PDF implies separate logic or composite. Let's do composite.
    // BMI 18.5-24.9 -> 0.5
    // IPAQ 'High' or 'Moderate' -> 0.5
    if (bmi && bmi >= 18.5 && bmi < 25) compD += 0.5;
    if (ipaqCategory === 'High' || ipaqCategory === 'Moderate') compD += 0.5;


    // --- Total ---
    const totalScore = compA + compB + compC + compD;
    const maxScore = 4.0;

    let compliance = 'Low';
    if (totalScore >= 3.0) compliance = 'High';
    else if (totalScore >= 2.0) compliance = 'Moderate';

    return { 
        score: totalScore, 
        max: maxScore, 
        compliance,
        components: { compA, compB, compC, compD }
    };
}

/**
 * Checks for specific Family History clusters.
 */
function calculateFamilyClusters(familyHistory?: any[]): Record<string, boolean> {
    if (!familyHistory || !Array.isArray(familyHistory)) return {};

    const relatives = familyHistory.map(f => ({
        relation: f.relation,
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx
    }));

    // 1. Breast/Ovarian Cluster
    // Rule: >= 2 blood relatives (1st/2nd degree) with Breast or Ovarian
    // Note: Assuming all entered relatives are blood relatives (usually the case in these forms)
    const breastOvarianCount = relatives.filter(r => 
        r.cancer.includes('breast') || r.cancer.includes('ovarian')
    ).length;

    // 2. Colorectal Cluster
    // Rule: >= 2 relatives with Colorectal
    const colorectalCount = relatives.filter(r => 
        r.cancer.includes('colon') || r.cancer.includes('rectal') || r.cancer.includes('colorectal')
    ).length;

    // 3. Childhood or Rare Cluster
    // Rule: Any diagnosis < 20y OR rare type (Sarcoma, etc.)
    const rareTypes = ['sarcoma', 'glioblastoma', 'adrenocortical', 'retinoblastoma', 'wilms'];
    const childhoodOrRare = relatives.some(r => 
        (r.age !== undefined && r.age < 20) || 
        rareTypes.some(t => r.cancer.includes(t))
    );

    return {
        pattern_breast_ovarian_cluster: breastOvarianCount >= 2,
        pattern_colorectal_cluster: colorectalCount >= 2,
        pattern_childhood_or_rare_cluster: childhoodOrRare
    };
}
        
/**
 * Checks for hereditary cancer syndromes (Lynch, HBOC) - Flags
 */
function calculateSyndromeFlags(familyHistory?: any[]): Record<string, boolean> {
    if (!familyHistory || !Array.isArray(familyHistory)) return {};
    
    const relatives = familyHistory.map(f => ({
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx
    }));
    
    // Lynch: Amsterdam II criteria simplified for screening (3-2-1 rule approx)
    // 3 relatives with Lynch-associated cancer
    const lynchCancers = ['colorectal', 'endometrial', 'ovarian', 'stomach', 'pancreatic', 'biliary', 'urinary', 'brain', 'skin', 'small intestine'];
    const lynchMatches = relatives.filter(r => lynchCancers.some(c => r.cancer.includes(c)));
    
    // We strictly need >= 3 relatives to flag "pattern_lynch_syndrome" as high suspicion?
    // PDF usually implies a flag if criteria met.
    const isLynch = lynchMatches.length >= 3;
    
    return {
        pattern_lynch_syndrome: isLynch
    };
}

/**
 * Checks for Occupational Risk flags.
 */
function calculateOccupationalFlags(history?: any[]): Record<string, boolean> {
    if (!history || !Array.isArray(history)) return {};

    // Lung High Risk Carcinogens (PDF Spec)
    // Asbestos, Silica, Diesel, Welding, Painting, Radon, Arsenic, Cadmium, Chromium, Nickel, Beryllium, Soot
    const lungCarcinogens = [
        'asbestos', 'silica', 'diesel', 'welding', 'painting', 'painter', 'radon__occ', 
        'arsenic', 'cadmium', 'chromium', 'nickel', 'beryllium', 'soot', 'metal_fluids'
    ]; 
    
    // Mesothelioma Flag: Asbestos AND Years >= 1
    
    let lungRisk = false;
    let mesoFlag = false;

    history.forEach(job => {
        // Handle both flattened hazards array (if simple list) or structured job object
        // Assuming structure: { job_title?: string, hazards?: string[], years?: number, occ_exposures?: string[] }
        // Standardization might map checkbox values to 'occ_exposures' array in a single 'job' entry for simpler forms.
        
        const possibleHazards = [...(job.occ_exposures || []), ...(job.hazards || [])];
        if (job.hazard) possibleHazards.push(job.hazard); // legacy single
        if (job.job_title && lungCarcinogens.includes(job.job_title.toLowerCase())) possibleHazards.push(job.job_title.toLowerCase());

        const years = job.years || 0;
        
        // Check for any lung carcinogen overlap
        const hasCarcinogen = lungCarcinogens.some(c => possibleHazards.includes(c));
        
        if (hasCarcinogen && years >= 10) {
            lungRisk = true;
        }
        
        if (possibleHazards.includes('asbestos') && years >= 1) {
            mesoFlag = true;
        }
    });

    return {
        'occ.lung_highrisk': lungRisk,
        'occ.mesothelioma_flag': mesoFlag
    };
}

/**
 * Checks for hereditary cancer syndromes (Lynch, HBOC) - Legacy/Simple version
 * Keeping for backward compatibility or merging?
 * The new 'calculateFamilyClusters' provides distinct flags. 
 * We can keep this for the specific 'syndromes' output or deprecate.
 * We will return an array of strings as before.
 */
function calculateFamilySyndromes(familyHistory?: any[]): string[] {
    const syndromes: string[] = [];
    const clusters = calculateFamilyClusters(familyHistory);

    if (clusters.pattern_breast_ovarian_cluster) syndromes.push('Cluster: Breast/Ovarian');
    if (clusters.pattern_colorectal_cluster) syndromes.push('Cluster: Colorectal');
    
    // Legacy Lynch check (more specific than just cluster)
    // ... (Keep simplified logic or rely on clusters? User PDF asked for specific flags)
    // Let's keep the existing logic for Lynch/HBOC specific labeling if it adds value beyond flags
    // Re-implementing simplified version that uses the flags + age
    
    const relatives = familyHistory?.map(f => ({
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx
    })) || [];

    // Lynch: 3+ colorectal/endo/etc + young
    const lynchCancers = ['colorectal', 'endometrial', 'ovarian', 'stomach', 'pancreatic', 'biliary', 'urinary', 'brain', 'skin'];
    const lynchMatches = relatives.filter(r => lynchCancers.some(c => r.cancer.includes(c)));
    if (lynchMatches.length >= 3 && lynchMatches.some(r => r.age && r.age < 50)) {
        syndromes.push('Potential Lynch Syndrome');
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
      // We are implementing this as `derived.red_meat_gwk` and `derived.proc_meat_gwk`
      // These are also used inside calculateWcrf now (re-calculated there or passed? I re-calc inside wcrf for encapsulation)
      if (typeof core.diet?.red_meat_servings_week === 'number' || typeof core.diet?.diet_red_meat === 'number') {
          const val = core.diet.red_meat_servings_week ?? core.diet.diet_red_meat;
          derived.red_meat_gwk = val * 100;
      }
      if (typeof core.diet?.processed_meat_servings_week === 'number' || typeof core.diet?.diet_processed_meat === 'number') {
           const val = core.diet.processed_meat_servings_week ?? core.diet.diet_processed_meat;
          derived.proc_meat_gwk = val * 50;
      }

      // SSB Calculation (mL/week)
      // core.diet.ssb_servings_week (number)
      // core.diet.ssb_size (container type -> mL map needed)
      if (typeof core.diet?.ssb_servings_week === 'number') {
          const freq = core.diet.ssb_servings_week;
          const sizeType = core.diet.ssb_size || 'Can'; // Default
          // Map: Can=330, Bottle=500, Glass=250 (Approx standards)
          let mlPerServing = 330;
          if (sizeType === 'Bottle') mlPerServing = 500;
          if (sizeType === 'Glass') mlPerServing = 250;
          if (sizeType === 'Large Bottle') mlPerServing = 1000; // if exists
          
          derived.ssb_mLwk = freq * mlPerServing;
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
      
      // Family History Clusters
      const famClusters = calculateFamilyClusters(advanced.family);
      const syndromeFlags = calculateSyndromeFlags(advanced.family);
      Object.assign(derived, famClusters, syndromeFlags);

      // Check for high-risk occupational exposures (Composite + Specific Flags)
      const exposures = calculateExposureComposites(advanced.occupational);
      if (exposures !== null) {
          derived.exposure_composites = exposures;
      }
      const occFlags = calculateOccupationalFlags(advanced.occupational);
      Object.assign(derived, occFlags); // Merges occ.lung_highrisk, etc into derived root

      // --- Sexual Health Flags ---
      const sexHistory = advanced.sexual_health || {};
      const sexAtBirth = core.sex_at_birth;
      // MSM Behavior: Male AND (Partner=Male or Both)
      let msmBehavior = false;
      // sexhx.partner_genders can be an array in standardizedData if checkbox_group, or single string if select/radio
      const partnerGenders = sexHistory['sexhx.partner_genders'];
      
      if (sexAtBirth === 'Male') {
          if (Array.isArray(partnerGenders)) {
             if (partnerGenders.some((g: string) => g.toLowerCase() === 'male' || g.toLowerCase() === 'same sex')) {
                msmBehavior = true;
             }
          } else if (typeof partnerGenders === 'string') {
             if (partnerGenders.toLowerCase() === 'male' || partnerGenders.toLowerCase() === 'both' || partnerGenders.toLowerCase() === 'same sex') {
                 msmBehavior = true;
             }
          }
      }
      derived['sex.msm_behavior'] = msmBehavior;

      // High Risk Anal Cancer Group
      // Rule: HIV OR Transplant OR (Male AND MSM)
      const conditions = standardizedData.core?.conditions || []; 
      // Assuming 'conditions' is an array of IDs like ['hiv', 'transplant', 'diabetes'...]
      
      const hasHiv = conditions.includes('hiv');
      const hasTransplant = conditions.includes('transplant');
      
      if (hasHiv || hasTransplant || msmBehavior) {
          derived['sex.highrisk_anal_cancer_group'] = true;
      } else {
          derived['sex.highrisk_anal_cancer_group'] = false;
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
      const wcrf = calculateWcrf(core.diet, audit?.score, bmi || null, ipaq?.category); // fixed type error
      if (wcrf) derived.wcrf_score = wcrf;

      // Family Syndromes (Legacy List)
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
      