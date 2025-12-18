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

    it("should set highrisk_anal_cancer_group to true if user has HIV and MSM behavior", () => {
        const standardizedData = {
          core: { sex_at_birth: 'Male' },
          advanced: { 
              illnesses: [{ id: 'hiv' }],
              sexual_health: { 'sexhx.partner_genders': 'Male' }
          }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived['sex.highrisk_anal_cancer_group']).toBe(true);
    });

    it("should set highrisk_anal_cancer_group to true for Male MSM >= 35", () => {
      const standardizedData = {
        core: { sex_at_birth: 'Male', dob: '1980-01-01' },
        advanced: { sexual_health: { 'sexhx.partner_genders': 'Male' } }
      };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived['sex.msm_behavior']).toBe(true);
      expect(derived.age_years).toBeGreaterThanOrEqual(35);
      expect(derived['sex.highrisk_anal_cancer_group']).toBe(true);
    });

    it("should set highrisk_anal_cancer_group to false for Female with 'Male' partners", () => {
      const standardizedData = {
        core: { sex_at_birth: 'Female' },
        advanced: { sexual_health: { 'sexhx.partner_genders': 'Male' } }
      };
      const derived = DerivedVariablesService.calculateAll(standardizedData);
      expect(derived['sex.msm_behavior']).toBe(false);
      expect(derived['sex.highrisk_anal_cancer_group']).toBe(false);
    });

    it("should set highrisk_anal_cancer_group to false for Male Heterosexual", () => {
        const standardizedData = {
          core: { sex_at_birth: 'Male' },
          advanced: { sexual_health: { 'sexhx.partner_genders': 'Female' } }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived['sex.msm_behavior']).toBe(false);
        expect(derived['sex.highrisk_anal_cancer_group']).toBe(false);
    });
    
    // Testing specific family relations update
    it("should set early_age_family_dx to true for Mother < 50", () => {
        const standardizedData = {
            advanced: {
                family: [{ relation: 'Mother', age_dx: 45 }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.early_age_family_dx).toBe(true);
    });

    // Occupational Risk (Soot)
    it("should set lung_highrisk for Soot exposure > 10 years", () => {
        const standardizedData = {
            advanced: {
                occupational: [{ job_title: 'sweeper', occ_exposures: ['soot'], years: 12 }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived['occ.lung_highrisk']).toBe(true);
    });
    
    // Occupational Risk (Painter job title)
     it("should set lung_highrisk for Painter job title > 10 years", () => {
        const standardizedData = {
            advanced: {
                occupational: [{ job_title: 'Painter', years: 15 }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived['occ.lung_highrisk']).toBe(true);
    });

    it("should calculate AUDIT-C 4-tier risk bands", () => {
        const testCases = [
            { q1: 1, q2: 1, q3: 1, expected: 'Low' },
            { q1: 2, q2: 2, q3: 1, expected: 'Increasing' },
            { q1: 3, q2: 3, q3: 2, expected: 'Higher' },
            { q1: 4, q2: 4, q3: 3, expected: 'Possible dependence' }
        ];

        testCases.forEach(({ q1, q2, q3, expected }) => {
            const data = { core: { alcohol_audit: { q1, q2, q3 } } };
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived.alcohol_audit.risk).toBe(expected);
        });
    });

    it("should classify WCRF Moderate compliance at 1.5", () => {
        const standardizedData = {
            core: {
                diet: { vegetables: 4, fast_food: 1, red_meat: 3.5, processed_meat: 0, sugary_drinks: 0 }
            }
        };
        // compA (fv=4) = 0.5, compB (ff=1) = 1.0, compC (red=350, proc=0) = 1.0, compD (ssb=0) = 1.0
        // Total = 3.5 -> High
        // Let's adjust compC to be 0
        standardizedData.core.diet.red_meat = 6; // redMeatGwk = 600 -> compC = 0
        standardizedData.core.diet.vegetables = 4; // compA = 0.5
        // total = 0.5 + 1.0 + 0 + 1.0 = 2.5 -> Moderate
        
        let derived = DerivedVariablesService.calculateAll(standardizedData);
        expect(derived.wcrf_score.compliance).toBe('Moderate');

        // Close to threshold: 1.5
        const midData = {
            core: {
                diet: { vegetables: 4, fast_food: 4, red_meat: 6, processed_meat: 0, sugary_drinks: 0 }
            }
        };
        // compA = 0.5, compB (ff=4) = 0, compC (red=600) = 0, compD (ssb=0) = 1.0
        // Total = 1.5 -> Moderate
        derived = DerivedVariablesService.calculateAll(midData);
        expect(derived.wcrf_score.score).toBe(1.5);
        expect(derived.wcrf_score.compliance).toBe('Moderate');
    });

    it("should set env.air_longterm_high based on years", () => {
        const dataHigh = { advanced: { environment: { 'env.air.high_pollution_years': 10 } } };
        const derivedHigh = DerivedVariablesService.calculateAll(dataHigh);
        expect(derivedHigh['env.air_longterm_high']).toBe(true);
        expect(derivedHigh['env.any_high_count']).toBeGreaterThanOrEqual(1);

        const dataLow = { advanced: { environment: { 'env.air.high_pollution_years': 9 } } };
        const derivedLow = DerivedVariablesService.calculateAll(dataLow);
        expect(derivedLow['env.air_longterm_high']).toBe(false);
    });

    it("should detect ca.colorectal_history from personal cancer history", () => {
        const data = {
            advanced: {
                personal_cancer_history: [{ type: 'Colon Cancer' }]
            }
        };
        const derived = DerivedVariablesService.calculateAll(data);
        expect(derived['ca.colorectal_history']).toBe(true);
    });

    it("should set sex.opted_out correctly", () => {
        const dataOptOut = { advanced: { sexual_health: { 'sexhx.section_opt_in': 'No' } } };
        const derivedOptOut = DerivedVariablesService.calculateAll(dataOptOut);
        expect(derivedOptOut['sex.opted_out']).toBe(true);

        const dataOptIn = { advanced: { sexual_health: { 'sexhx.section_opt_in': 'Yes' } } };
        const derivedOptIn = DerivedVariablesService.calculateAll(dataOptIn);
        expect(derivedOptIn['sex.opted_out']).toBe(false);
    });

    it("should set shs.none_flag correctly", () => {
        const dataNone = { advanced: { smoking_detail: { shs: { home_freq: 'Never', work_freq: 'Never' } } } };
        const derivedNone = DerivedVariablesService.calculateAll(dataNone);
        expect(derivedNone['shs.none_flag']).toBe(true);

        const dataSome = { advanced: { smoking_detail: { shs: { home_freq: 'Daily' } } } };
        const derivedSome = DerivedVariablesService.calculateAll(dataSome);
        expect(derivedSome['shs.none_flag']).toBe(false);
    });
  });
});
      