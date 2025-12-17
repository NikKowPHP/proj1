
import { DerivedVariablesService } from '@/lib/services/derived-variables.service';
import { StandardizationService } from '@/lib/services/standardization.service';
import clinicalConfig from '@/lib/clinical-config.json';

// Minimal mock of the standardization output structure needed for testing
const mockStandardized = (core: any, advanced: any) => ({ core, advanced });

describe('Discrepancy Verification', () => {
    
    describe('Genetics Gene Matching (Lynch)', () => {
        it('should detect Lynch Syndrome when user selects grouped option string "Lynch (MLH1...)"', () => {
            const data = mockStandardized(
                { dob: '1980', sex_at_birth: 'Female' }, // Age 45
                {
                    genetics: {
                        tested: true,
                        genes: ["Lynch (MLH1/MSH2/MSH6/PMS2/EPCAM)"] // The problematic string from frontend
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['gen.lynch_syndrome']).toBe(true);
        });

        it('should detect Lynch Syndrome when user selects specific gene "MLH1"', () => {
             const data = mockStandardized(
                { dob: '1980', sex_at_birth: 'Female' },
                {
                    genetics: {
                        tested: true,
                        genes: ["MLH1"]
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['gen.lynch_syndrome']).toBe(true);
        });
    });

    describe('Radon Level Categorization', () => {
        it('should trigger env.radon_high for "High (>=300)"', () => {
             const data = mockStandardized(
                { dob: '1980', sex_at_birth: 'Female' },
                {
                    environment: {
                        "env.radon.tested": "Yes",
                        "env.radon.level_cat": "High (>=300)" // Exact string from JSON
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['env.radon_high']).toBe(true);
        });

        it('should trigger env.radon_high for "Moderate (100-299)"', () => {
             const data = mockStandardized(
                { dob: '1980', sex_at_birth: 'Female' },
                {
                    environment: {
                        "env.radon.tested": "Yes",
                        "env.radon.level_cat": "Moderate (100-299)"
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['env.radon_high']).toBe(true);
        });
        
        it('should NOT trigger env.radon_high for "Low"', () => {
             const data = mockStandardized(
                { dob: '1980', sex_at_birth: 'Female' },
                {
                    environment: {
                        "env.radon.tested": "Yes",
                        "env.radon.level_cat": "Low"
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['env.radon_high']).toBe(false);
        });
    });

    describe('Sexual Health Partner Count (HPV Risk)', () => {
        it('should classify HPV Exposure as "Higher" for inputs that include "6 or more" recent partners', () => {
            // Note: Our logic checks for inclusion in the config array which we updated
            const data = mockStandardized(
                { dob: '1990', sex_at_birth: 'Female' },
                {
                    sexual_health: {
                        "sexhx.partners_12m_cat": "6 or more", // Frontend string
                        "sexhx.lifetime_partners_cat": "5-9" // Moderate lifetime
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['sex.hpv_exposure_band']).toBe('Higher');
        });
    });

    describe('Configuration-Driven Thresholds', () => {
        it('should use loaded config for Cervical Screening Due (Default 3 years)', () => {
            // Config says 3 years.
            // Screened 4 years ago -> Due
            const currentYear = new Date().getFullYear();
            const lastPap = currentYear - 4;
            
            const data = mockStandardized(
                { dob: '1985', sex_at_birth: 'Female' }, // Age 40 (eligible band)
                {
                    screening_immunization: {
                        "screen.cervix.last_year": lastPap
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['screen.cervix_due']).toBe(true);
        });

         it('should use loaded config for Cervical Screening Due (Not Due if < 3 years)', () => {
            const currentYear = new Date().getFullYear();
            const lastPap = currentYear - 2;
            
            const data = mockStandardized(
                { dob: '1985', sex_at_birth: 'Female' },
                {
                    screening_immunization: {
                        "screen.cervix.last_year": lastPap
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['screen.cervix_due']).toBe(false);
        });
    });

    // REPRODUCTION TESTS

    describe('IBD Duration Logic (Standardization)', () => {
        it('should map cond.ibd.year_dx to illness.year', () => {
             const answers = {
                "cond.summary": ["ibd"],
                "cond.ibd.type": "Ulcerative Colitis",
                "cond.ibd.year_dx": "2010"
             };
             const result = StandardizationService.standardize(answers);
             const ibd = result.advanced.illnesses.find((i: any) => i.id === 'ibd');
             expect(ibd).toBeDefined();
             // This expectation fails if the mapping is missing
             expect(ibd.year).toBe(2010);
        });
    });

    describe('Reproduction: HBV Status Mismatch', () => {
        it('should flag hcc.surveillance_candidate for HBV status "Current"', () => {
             const data = mockStandardized(
                { dob: '1980', sex_at_birth: 'Male' },
                {
                    illnesses: [
                        { id: 'hbv', status: 'Current' } // Use the value from Standardization as it SHOULD be mapped from "Current"
                    ]
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['hcc.surveillance_candidate']).toBe(true);
        });
    });

    describe('Reproduction: Lynch High Penetrance Flag', () => {
        it('should flag gen.high_penetrance_carrier for "Lynch (MLH1...)" string', () => {
             const data = mockStandardized(
                { dob: '1980', sex_at_birth: 'Female' },
                {
                    genetics: {
                        tested: true,
                        genes: ["Lynch (MLH1/MSH2/MSH6/PMS2/EPCAM)"]
                    }
                }
            );
            const derived = DerivedVariablesService.calculateAll(data);
            expect(derived['gen.high_penetrance_carrier']).toBe(true);
        });
    });

});
