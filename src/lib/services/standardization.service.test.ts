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

  it("should correctly structure functional status with QoL consent", () => {
    const answers = {
      'ecog': '1',
      'qlq_c30_consent': 'true'
    };
    const result = StandardizationService.standardize(answers);
    expect(result.advanced.functional_status).toEqual({
      'ecog': '1',
      'qlq_c30_consent': true
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
