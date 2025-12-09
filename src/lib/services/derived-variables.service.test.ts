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

    it("should set bmi_obesity flag to true if BMI >= 30", () => {
      const standardizedData = { core: { height_cm: 170, weight_kg: 90 } }; // BMI ~31.1
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.flags.bmi_obesity).toBe(true);
    });

    it("should set bmi_obesity flag to false if BMI < 30", () => {
      const standardizedData = { core: { height_cm: 180, weight_kg: 75 } }; // BMI ~23.1
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived.flags.bmi_obesity).toBe(false);
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
      