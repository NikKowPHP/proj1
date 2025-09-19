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

  it("should correctly structure advanced genetics data", () => {
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
      