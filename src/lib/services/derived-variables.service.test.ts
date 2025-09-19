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

    it("should calculate pack-years correctly", () => {
        const standardizedData = {
            core: { smoking_status: 'Former' },
            advanced: { smoking_detail: { cigs_per_day: 20, years: 10 } }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.pack_years).toBe(10.0);
    });

    it("should return 0 pack-years for never smokers", () => {
        const standardizedData = { core: { smoking_status: 'Never' } };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.pack_years).toBe(0);
    });

    it("should create correct organ inventory for females", () => {
        const standardizedData = { core: { sex_at_birth: 'Female' } };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.organ_inventory).toEqual({
            has_cervix: true,
            has_uterus: true,
            has_ovaries: true,
            has_breasts: true
        });
    });

     it("should create correct organ inventory for males", () => {
        const standardizedData = { core: { sex_at_birth: 'Male' } };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.organ_inventory).toEqual({
            has_prostate: true,
            has_breasts: true
        });
    });
  });
});
      