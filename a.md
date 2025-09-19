<response>
<reasoning>
My plan is to implement the "Backend: Standardization & Derived Variables" section of the task list.

First, I will modify `src/lib/services/standardization.service.ts`. I will add logic to process `personal_cancer_history`, capture `quit_year` for smokers within the `smoking_detail` block, and expand the `functional_status` block to dynamically capture all EORTC QLQ-C30 Likert scale answers based on a naming convention (`qlq_c30_item_`).

Second, I will update `src/lib/services/derived-variables.service.ts`. I'll introduce two new helper functions: one to calculate `early_age_family_dx` by checking for first-degree relatives diagnosed under 50, and another to calculate `exposure_composites` by checking for high-risk occupational exposures like asbestos or benzene. I will then call these functions from the main `calculateAll` method.

Third, to maintain code quality, I will update the corresponding test files. In `src/lib/services/standardization.service.test.ts`, I'll add tests for the new `personal_cancer_history` and `quit_year` fields. In `src/lib/services/derived-variables.service.test.ts`, I will add new test cases to validate the logic for `early_age_family_dx` and `exposure_composites`.

Finally, I will update `TASKS.md` to mark all items in this section as complete.
</reasoning>
<modifications>
<file path="src/lib/services/derived-variables.service.test.ts">
      <![CDATA[
/** @jest-environment node */

import { DerivedVariablesService } from "./derived-variables.service";

describe("DerivedVariablesService", () => {
  describe("calculateAll", () => {
    it("should calculate age correctly from DOB", () => {
      const standardizedData = { core: { dob: "1990-05-15" } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      // This is dependent on the test run date, so we check for a reasonable range.
      expect(derived.age_years).toBeGreaterThan(30);
      expect(derived.age_years).toBeLessThan(40);
    });

    it("should return null for age with invalid DOB", () => {
      const standardizedData = { core: { dob: "invalid-date" } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.age_years).toBeUndefined();
    });

    it("should calculate BMI correctly", () => {
      const standardizedData = { core: { height_cm: 180, weight_kg: 75 } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.bmi.value).toBe(23.15);
    });

    it("should return null for BMI with missing data", () => {
      const standardizedData = { core: { height_cm: 180 } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.bmi).toBeUndefined();
    });

    it("should calculate pack-years correctly for a former smoker with quit_year", () => {
      const standardizedData = {
        core: { smoking_status: "Former" },
        advanced: { smoking_detail: { cigs_per_day: 20, years: 10, quit_year: 2020 } },
      };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.pack_years).toBe(10.0);
    });

    it("should calculate pack-years correctly for a current smoker", () => {
      const standardizedData = {
        core: { smoking_status: "Current" },
        advanced: { smoking_detail: { cigs_per_day: 10, years: 20 } },
      };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.pack_years).toBe(10.0);
    });

    it("should return 0 pack-years for never smokers", () => {
      const standardizedData = { core: { smoking_status: "Never" } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.pack_years).toBe(0);
    });

    it("should not calculate pack-years if smoking details are missing for a smoker", () => {
      const standardizedData = { core: { smoking_status: "Former" } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.pack_years).toBeUndefined();
    });

    it("should not calculate pack-years if smoking years are zero", () => {
      const standardizedData = {
        core: { smoking_status: "Former" },
        advanced: { smoking_detail: { cigs_per_day: 20, years: 0 } },
      };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.pack_years).toBeUndefined();
    });

    it("should not calculate pack-years if cigs_per_day is zero", () => {
        const standardizedData = {
          core: { smoking_status: "Former" },
          advanced: { smoking_detail: { cigs_per_day: 0, years: 10 } },
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.pack_years).toBeUndefined();
    });


    it("should create correct organ inventory for females", () => {
      const standardizedData = { core: { sex_at_birth: "Female" } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.organ_inventory).toEqual({
        has_cervix: true,
        has_uterus: true,
        has_ovaries: true,
        has_breasts: true,
      });
    });

    it("should create correct organ inventory for males", () => {
      const standardizedData = { core: { sex_at_birth: "Male" } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.organ_inventory).toEqual({
        has_prostate: true,
        has_breasts: true,
      });
    });

    it("should not create an organ inventory for Intersex sex at birth", () => {
      const standardizedData = { core: { sex_at_birth: "Intersex" } };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.organ_inventory).toBeUndefined();
    });
    
    it("should not create an organ inventory for 'Prefer not to say'", () => {
        const standardizedData = { core: { sex_at_birth: "Prefer not to say" } };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.organ_inventory).toBeUndefined();
    });

    it("should set early_age_family_dx to true for a first-degree relative with early diagnosis", () => {
        const standardizedData = {
            advanced: {
                family: [{ relation: 'Parent', age_dx: 45 }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.early_age_family_dx).toBe(true);
    });

    it("should set early_age_family_dx to false for a first-degree relative without early diagnosis", () => {
        const standardizedData = {
            advanced: {
                family: [{ relation: 'Sibling', age_dx: 55 }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.early_age_family_dx).toBe(false);
    });
    
    it("should set early_age_family_dx to false if only non-first-degree relatives have early diagnosis", () => {
        const standardizedData = {
            advanced: {
                family: [{ relation: 'Grandparent', age_dx: 40 }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.early_age_family_dx).toBe(false);
    });

    it("should set has_known_carcinogen_exposure to true if asbestos is present", () => {
        const standardizedData = {
            advanced: {
                occupational: [{ job_title: 'worker', occ_exposures: ['wood_dust', 'asbestos'] }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.exposure_composites.has_known_carcinogen_exposure).toBe(true);
    });
    
    it("should set has_known_carcinogen_exposure to true if benzene is present in any job", () => {
        const standardizedData = {
            advanced: {
                occupational: [
                    { job_title: 'worker', occ_exposures: ['wood_dust'] },
                    { job_title: 'painter', occ_exposures: ['benzene'] }
                ]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.exposure_composites.has_known_carcinogen_exposure).toBe(true);
    });

    it("should set has_known_carcinogen_exposure to false if no high-risk carcinogens are present", () => {
        const standardizedData = {
            advanced: {
                occupational: [{ job_title: 'worker', occ_exposures: ['wood_dust'] }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.exposure_composites.has_known_carcinogen_exposure).toBe(false);
    });
  });
});
      ]]>
</file>
<file path="src/lib/services/derived-variables.service.ts">
      <![CDATA[
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
      ]]>
</file>
<file path="src/lib/services/standardization.service.test.ts">
      <![CDATA[
/** @jest-environment node */
import { StandardizationService } from "./standardization.service";

describe("StandardizationService", () => {
  it("should correctly structure core fields", () => {
    const answers = {
      dob: "1990-01-01",
      sex_at_birth: "Male",
      height_cm: "180",
      weight_kg: "80",
      smoking_status: "Never",
      alcohol_use: "Moderate",
      symptoms: '["HP:0012378"]',
      family_cancer_any: "No",
    };
    const result = StandardizationService.standardize(answers);

    expect(result.core.dob).toBe("1990-01-01");
    expect(result.core.sex_at_birth).toBe("Male");
    expect(result.core.height_cm).toBe(180);
    expect(result.core.weight_kg).toBe(80);
    expect(result.core.symptoms).toEqual(["HP:0012378"]);
    expect(result.advanced).toEqual({});
  });

  it("should correctly structure advanced family history", () => {
    const answers = {
      family_cancer_history:
        '[{"relation":"Parent","cancer_type":"breast","age_dx":55}]',
    };
    const result = StandardizationService.standardize(answers);

    expect(result.advanced.family).toEqual([
      { relation: "Parent", cancer_type: "breast", age_dx: 55 },
    ]);
  });
  
  it("should correctly structure personal cancer history", () => {
    const answers = {
      personal_cancer_history:
        '[{"type":"breast","year_dx":2018,"treatments":["surgery"]}]',
    };
    const result = StandardizationService.standardize(answers);

    expect(result.advanced.personal_cancer_history).toEqual([
        { type: "breast", year_dx: 2018, treatments: ["surgery"] },
    ]);
  });

  it("should correctly structure smoking details including quit_year", () => {
    const answers = {
      smoking_status: "Former",
      cigs_per_day: "20",
      smoking_years: "10",
      quit_year: "2020",
    };
    const result = StandardizationService.standardize(answers);
    expect(result.advanced.smoking_detail).toEqual({
        cigs_per_day: 20,
        years: 10,
        quit_year: 2020
    });
  });

  it("should correctly structure advanced genetics data when tested", () => {
    const answers = {
      genetic_testing_done: "Yes",
      genetic_test_type: "Multigene panel",
      genetic_genes: '["BRCA1","BRCA2"]',
    };
    const result = StandardizationService.standardize(answers);

    expect(result.advanced.genetics.tested).toBe(true);
    expect(result.advanced.genetics.type).toBe("Multigene panel");
    expect(result.advanced.genetics.genes).toEqual(["BRCA1", "BRCA2"]);
  });

  it("should correctly structure occupational hazards data", () => {
      const answers = {
        occupational_hazards: '[{"job_title":"welder","job_years":10,"occ_exposures":["welding_fumes"]}]'
      };
      const result = StandardizationService.standardize(answers);
      expect(result.advanced.occupational).toEqual([
          { job_title: "welder", job_years: 10, occ_exposures: ["welding_fumes"] }
      ]);
  });
  
  it("should correctly structure personal medical history with details", () => {
      const answers = {
        illness_list: '["diabetes", "hypertension"]',
        illness_details_diabetes: '{"year":2010,"status":"active","confirmed":"yes"}',
        illness_details_hypertension: '{"year":2015,"status":"resolved","confirmed":"no"}'
      };
      const result = StandardizationService.standardize(answers);
      expect(result.advanced.illnesses).toHaveLength(2);
      expect(result.advanced.illnesses).toContainEqual({ id: "diabetes", year: 2010, status: "active", confirmed: "yes" });
      expect(result.advanced.illnesses).toContainEqual({ id: "hypertension", year: 2015, status: "resolved", confirmed: "no" });
  });

  it("should correctly structure screening and immunization history", () => {
    const answers = {
      'screen.colonoscopy.done': 'Yes',
      'screen.colonoscopy.date': '2020',
      'imm.hpv': 'No'
    };
    const result = StandardizationService.standardize(answers);
    expect(result.advanced.screening_immunization).toEqual({
      'screen.colonoscopy.done': 'Yes',
      'screen.colonoscopy.date': '2020',
      'imm.hpv': 'No'
    });
  });

  it("should correctly structure medications and iatrogenic data", () => {
    const answers = {
      'immunosuppression_now': 'Yes',
      'immunosuppression_cause': 'Medication for RA'
    };
    const result = StandardizationService.standardize(answers);
    expect(result.advanced.medications_iatrogenic).toEqual({
      'immunosuppression_now': 'Yes',
      'immunosuppression_cause': 'Medication for RA'
    });
  });

  it("should correctly structure functional status with QoL consent and items", () => {
    const answers = {
      'ecog': '1',
      'qlq_c30_consent': 'true',
      'qlq_c30_item_1': '2', // Example QoL item
      'qlq_c30_item_29': '4' // Example QoL item
    };
    const result = StandardizationService.standardize(answers);
    expect(result.advanced.functional_status).toEqual({
      'ecog': '1',
      'qlq_c30_consent': true,
      'qlq_c30_item_1': '2',
      'qlq_c30_item_29': '4'
    });
  });
  
  it("should not create a genetics block if testing was not done", () => {
      const answers = {
          genetic_testing_done: "No",
      };
      const result = StandardizationService.standardize(answers);
      expect(result.advanced.genetics).toBeUndefined();
  });
  
  it("should handle empty or invalid JSON strings gracefully", () => {
      const answers = {
          family_cancer_history: 'invalid-json',
          symptoms: ''
      };
      const result = StandardizationService.standardize(answers);
      
      expect(result.advanced.family).toBeUndefined();
      expect(result.core.symptoms).toEqual([]);
  });
});
      ]]>
</file>
<file path="src/lib/services/standardization.service.ts">
      <![CDATA[
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
        standardized.advanced.family = safeJsonParse(answers.family_cancer_history);
      }
      
      // Genetics
      if (answers.genetic_testing_done === 'Yes') {
        standardized.advanced.genetics = {
          tested: true,
          type: answers.genetic_test_type,
          year: answers.genetic_test_year,
          findings_present: answers.genetic_findings_present,
          genes: answers.genetic_genes, // This is now expected to be an array from the form
          vus_present: answers.genetic_vus_present,
        };
      }

      // Illnesses
      const illnessList = answers.illness_list;
      if (Array.isArray(illnessList) && illnessList.length > 0) {
          standardized.advanced.illnesses = illnessList.map((illnessId: string) => {
              const detailsKey = `illness_details_${illnessId}`;
              const details = answers[detailsKey] ? JSON.parse(answers[detailsKey]) : {};
              return {
                  id: illnessId,
                  ...details
              };
          });
      }

      // Personal Cancer History
      if (answers.personal_cancer_history) {
        standardized.advanced.personal_cancer_history = safeJsonParse(answers.personal_cancer_history);
      }

       // Occupational History
      if (answers.occupational_hazards) {
        standardized.advanced.occupational = safeJsonParse(answers.occupational_hazards);
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
      ]]>
</file>
<file path="TASKS.md">
      <![CDATA[
Of course. Here is a detailed and atomic TODO list in Markdown format to address all identified gaps and bring the codebase to 100% compliance with the `new_requirements.md` specification.

---

### Atomic Plan for 100% Compliance

This plan is broken down into logical sections. Completing these tasks will resolve all identified discrepancies between the current implementation and the new requirements.

#### 1. Backend: Core Logic & Guideline Expansion

*(This is the highest priority section. The value of new UI components is limited until the backend can process and act on the data they collect.)*

-   [x] **Expand Guideline Rule Engine Capabilities:**
    -   [x] Modify the `checkCondition` function in `src/lib/services/guideline-engine.service.ts` to support an `array_contains` operator for checking values within arrays (e.g., for gene lists or occupational exposures).
-   [x] **Add New Guideline Rules for Genetics:**
    -   [x] In `src/lib/preventive-plan-config.en.json`, add a rule for `GENETIC_COUNSELING_REFERRAL` that triggers if `standardized.advanced.genetics.genes` contains `BRCA1` or `BRCA2`.
    -   [x] Add a similar rule for Lynch Syndrome genes (`MLH1`, `MSH2`, etc.).
    -   [x] Replicate these new rules with Polish values in `src/lib/preventive-plan-config.pl.json`.
-   [x] **Add New Guideline Rules for Family History:**
    -   [x] In `src/lib/preventive-plan-config.en.json`, add a rule that triggers a recommendation for earlier screening (e.g., `EARLY_COLORECTAL_SCREENING`) if the (yet-to-be-created) `derived.early_age_family_dx` flag is `true`.
    -   [x] Replicate this rule in `src/lib/preventive-plan-config.pl.json`.
-   [x] **Add New Guideline Rules for Occupational Hazards:**
    -   [x] In `src/lib/preventive-plan-config.en.json`, modify the `LUNG_CANCER_SCREENING` rule to also consider occupational exposures like `asbestos` in addition to smoking history.
    -   [x] Add a new rule for `DERMATOLOGY_CONSULT_BENZENE` that triggers for specific chemical exposures.
    -   [x] Replicate these rules in `src/lib/preventive-plan-config.pl.json`.

#### 2. Backend: Standardization & Derived Variables

-   [x] **Implement `personal_cancer_history` Standardization:**
    -   [x] In `src/lib/services/standardization.service.ts`, add a new block to process the `personal_cancer_history` answer. It should parse the JSON string and structure it under `standardized.advanced.personal_cancer_history`.
-   [x] **Implement New Derived Variables:**
    -   [x] In `src/lib/services/derived-variables.service.ts`, create a new function to calculate `early_age_family_dx`. This function should iterate through `standardized.advanced.family` and return `true` if any first-degree relative has an `age_dx` less than 50.
    -   [x] In the same service, create a function to calculate `exposure_composites`. For now, this can be a simple flag (e.g., `has_known_carcinogen_exposure: true`) if `standardized.advanced.occupational.occ_exposures` contains high-risk items like `asbestos` or `benzene`.
-   [x] **Capture `quit_year` for Smokers:**
    -   [x] In `src/lib/services/standardization.service.ts`, update the `smoking_detail` block to also process the `quit_year` field from the form answers.
-   [x] **Process QLQ-C30 Functional Status Data:**
    -   [x] In `src/lib/services/standardization.service.ts`, expand the `functional_status` block to process the new Likert scale answers from the EORTC QLQ-C30 questions.

#### 3. Frontend: Component & Schema Updates

-   [ ] **Implement Full Functional Status Module:**
    -   [ ] In `src/lib/assessment-questions.json`, replace the single `qlq_c30_consent` checkbox with the actual set of EORTC QLQ-C30 Likert scale questions as specified. Each should be a `select` or `slider` type.
    -   [ ] Update the `FunctionalStatus.tsx` component in `src/components/assessment/FunctionalStatus.tsx` to render these new, detailed questions when the module is expanded.
-   [ ] **Enhance Labs & Imaging Module:**
    -   [ ] In `src/components/assessment/LabsAndImaging.tsx`, modify the `RepeatingGroup` item to include new `Input` fields for "Result Value" and a `Select` for "Units" (e.g., mg/dL, IU/L).
    -   [ ] Update the component's state and `onChange` handler to manage these new fields.
    -   [ ] In `src/lib/assessment-questions.json`, update the `labs_and_imaging` module definition to reflect these more detailed fields.
-   [ ] **Add `quit_year` Field to UI:**
    -   [ ] In `src/lib/assessment-questions.json`, add a new `year_input` question with the ID `quit_year` to the `smoking_details` module.
    -   [ ] Ensure its `dependsOn` logic makes it appear only when `smoking_status` is "Former".
    -   [ ] Update `src/components/assessment/SmokingDetails.tsx` to correctly render this new field.
-   [ ] **Implement UI Tooltips:**
    -   [ ] In `src/app/[locale]/assessment/page.tsx`, modify the question rendering logic to check for a `q.tooltip` property.
    -   [ ] If a tooltip exists, wrap the `Label` with `TooltipProvider`, `Tooltip`, and `TooltipTrigger` from `shadcn/ui`, adding an `Info` icon next to the label.
    -   [ ] In `src/lib/assessment-questions.json`, add `tooltip` text to at least three complex questions in the Genetics module (e.g., for "pathogenic variants," "HGVS," and "VUS").

#### 4. AI & Prompt Engineering

-   [ ] **Expand AI Prompt Content Map:**
    -   [ ] In `src/lib/ai/prompts/preventivePlanExplainer.prompt.ts`, add detailed instructions to the "SPECIFIC ACTION ID CONTENT MAP" section for the new rules created in step 1 (e.g., `GENETIC_COUNSELING_REFERRAL`, `EARLY_COLORECTAL_SCREENING`, `DERMATOLOGY_CONSULT_BENZENE`).
    -   [ ] Update the main prompt to instruct the AI to personalize explanations by referencing new derived variables like `derived.early_age_family_dx` and data from `standardized.advanced.genetics`.

#### 5. Code Cleanup & Refinement

-   [ ] **Resolve Medication Component Discrepancy:**
    -   [ ] Decide on a single implementation path: either enhance and use the `src/components/assessment/Medications.tsx` component for the "Medications / Iatrogenic" section or remove the unused component file.
    -   [ ] If keeping the component, refactor the questions in `src/lib/assessment-questions.json` to use this dedicated component. If not, delete `src/components/assessment/Medications.tsx`.
      ]]>
</file>
</modifications>
</response>