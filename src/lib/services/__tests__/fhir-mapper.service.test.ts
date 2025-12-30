import { FhirMapperService } from '../fhir-mapper.service';
import type { FhirBundle } from '@/lib/types/fhir';

describe('FhirMapperService', () => {
  describe('toFhirBundle', () => {
    it('should create a valid FHIR Bundle with Patient resource', () => {
      const answers = {
        dob: '1980-01-15',
        sex_at_birth: 'Female'
      };

      const standardized = {
        core: {
          dob: '1980-01-15',
          sex_at_birth: 'Female'
        },
        advanced: {}
      };

      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('collection');
      expect(bundle.entry.length).toBeGreaterThan(0);

      // Check Patient resource
      const patientEntry = bundle.entry.find(e => e.resource.resourceType === 'Patient');
      expect(patientEntry).toBeDefined();
      expect(patientEntry?.resource).toMatchObject({
        resourceType: 'Patient',
        birthDate: '1980-01-15',
        gender: 'female'
      });
    });

    it('should include QuestionnaireResponse with all answers', () => {
      const answers = {
        dob: '1980-01-15',
        sex_at_birth: 'Male',
        height_cm: '180',
        weight_kg: '75'
      };

      const standardized = {
        core: {
          dob: '1980-01-15',
          sex_at_birth: 'Male'
        },
        advanced: {}
      };

      const derived = {
        age_years: 44,
        bmi: { value: 23.1, category: 'Normal' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const qrEntry = bundle.entry.find(e => e.resource.resourceType === 'QuestionnaireResponse');
      expect(qrEntry).toBeDefined();
      
      const qr = qrEntry?.resource as any;
      expect(qr.status).toBe('completed');
      expect(qr.item).toHaveLength(4);
      expect(qr.item.some((i: any) => i.linkId === 'dob')).toBe(true);
    });

    it('should create Observation resources for BMI and pack-years', () => {
      const answers = {
        dob: '1970-05-20',
        sex_at_birth: 'Male'
      };

      const standardized = {
        core: {
          dob: '1970-05-20',
          sex_at_birth: 'Male'
        },
        advanced: {}
      };

      const derived = {
        age_years: 54,
        bmi: { value: 28.3, category: 'Overweight' },
        pack_years: 15
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const observations = bundle.entry.filter(e => e.resource.resourceType === 'Observation');
      expect(observations.length).toBe(3);

      // Check BMI observation
      const bmiObs = observations.find(e => {
        const obs = e.resource as any;
        return obs.code.coding[0].code === '39156-5';
      });
      expect(bmiObs).toBeDefined();
      const bmi = bmiObs?.resource as any;
      expect(bmi.valueQuantity.value).toBe(28.3);
      expect(bmi.valueQuantity.unit).toBe('kg/m2');

      // Check pack-years observation
      const pyObs = observations.find(e => {
        const obs = e.resource as any;
        return obs.code.coding[0].code === '401201003';
      });
      expect(pyObs).toBeDefined();
      const py = pyObs?.resource as any;
      expect(py.valueQuantity.value).toBe(15);
    });

    it('should create AUDIT-C score observation', () => {
      const answers = { dob: '1980-01-15', sex_at_birth: 'Male' };
      const standardized = {
        core: { dob: '1980-01-15', sex_at_birth: 'Male' },
        advanced: {}
      };
      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 0,
        alcohol_audit: { score: 5, risk: 'Hazardous' }
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const auditObs = bundle.entry.find(e => {
        if (e.resource.resourceType !== 'Observation') return false;
        const obs = e.resource as any;
        return obs.code.coding.some((c: any) => c.code === 'onkn.alcohol.audit_c_score');
      });

      expect(auditObs).toBeDefined();
      const audit = auditObs?.resource as any;
      expect(audit.valueQuantity.value).toBe(5);
      expect(audit.code.coding).toContainEqual(
        expect.objectContaining({ system: 'http://loinc.org', code: '75626-2' })
      );
    });

    it('should create IPAQ MET-minutes observation', () => {
      const answers = { dob: '1980-01-15', sex_at_birth: 'Female' };
      const standardized = {
        core: { dob: '1980-01-15', sex_at_birth: 'Female' },
        advanced: {}
      };
      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 0,
        physical_activity_ipaq: { metMinutes: 2400, category: 'High', who2020_meets: true }
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const ipaqObs = bundle.entry.find(e => {
        if (e.resource.resourceType !== 'Observation') return false;
        const obs = e.resource as any;
        return obs.code.coding.some((c: any) => c.code === 'onkn.pa.met.total');
      });

      expect(ipaqObs).toBeDefined();
      const ipaq = ipaqObs?.resource as any;
      expect(ipaq.valueQuantity.value).toBe(2400);
      expect(ipaq.valueQuantity.unit).toBe('MET.min/wk');
    });

    it('should create WCRF score observation', () => {
      const answers = { dob: '1980-01-15', sex_at_birth: 'Female' };
      const standardized = {
        core: { dob: '1980-01-15', sex_at_birth: 'Female' },
        advanced: {}
      };
      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 0,
        wcrf_score: { score: 3.5, max: 4.0, compliance: 'High', components: {} }
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const wcrfObs = bundle.entry.find(e => {
        if (e.resource.resourceType !== 'Observation') return false;
        const obs = e.resource as any;
        return obs.code.coding.some((c: any) => c.code === 'onkn.wcrf.diet_total');
      });

      expect(wcrfObs).toBeDefined();
      const wcrf = wcrfObs?.resource as any;
      expect(wcrf.valueQuantity.value).toBe(3.5);
      expect(wcrf.code.coding[0].display).toBe('WCRF Dietary Compliance Score');
    });

    it('should create MSM behavior observation when flag is true', () => {
      const answers = { dob: '1980-01-15', sex_at_birth: 'Male' };
      const standardized = {
        core: { dob: '1980-01-15', sex_at_birth: 'Male' },
        advanced: {}
      };
      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 0,
        'sex.msm_behavior': true
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const msmObs = bundle.entry.find(e => {
        if (e.resource.resourceType !== 'Observation') return false;
        const obs = e.resource as any;
        return obs.code.coding.some((c: any) => c.code === 'onkn.sex.msm_behavior');
      });

      expect(msmObs).toBeDefined();
      const msm = msmObs?.resource as any;
      expect(msm.valueBoolean).toBe(true);
    });

    it('should create HPV exposure band observation', () => {
      const answers = { dob: '1980-01-15', sex_at_birth: 'Female' };
      const standardized = {
        core: { dob: '1980-01-15', sex_at_birth: 'Female' },
        advanced: {}
      };
      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 0,
        'sex.hpv_exposure_band': 'Higher'
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const hpvObs = bundle.entry.find(e => {
        if (e.resource.resourceType !== 'Observation') return false;
        const obs = e.resource as any;
        return obs.code.coding.some((c: any) => c.code === 'onkn.sex.hpv_exposure_band');
      });

      expect(hpvObs).toBeDefined();
      const hpv = hpvObs?.resource as any;
      expect(hpv.valueString).toBe('Higher');
    });

    it('should create Condition resources for symptoms with HPO codes', () => {
      const answers = { dob: '1980-01-15', sex_at_birth: 'Female' };
      const standardized = {
        core: {
          dob: '1980-01-15',
          sex_at_birth: 'Female',
          symptoms: ['HP:0033840', 'HP:0002027', 'HP:0001824']
        },
        advanced: {
          symptom_details: {
            'HP:0033840': { onset_year: '2023' }
          }
        }
      };
      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const symptomConditions = bundle.entry.filter(e => {
        if (e.resource.resourceType !== 'Condition') return false;
        const cond = e.resource as any;
        return cond.code.coding.some((c: any) => c.system === 'http://human-phenotype-ontology.org');
      });

      expect(symptomConditions.length).toBe(3);

      // Check that HPO codes are correctly mapped
      const pmb = symptomConditions.find(e => {
        const cond = e.resource as any;
        return cond.code.coding[0].code === 'HP:0033840';
      });
      expect(pmb).toBeDefined();
      const pmbCond = pmb?.resource as any;
      expect(pmbCond.onsetDateTime).toBe('2023');
      expect(pmbCond.clinicalStatus.coding[0].code).toBe('active');
      expect(pmbCond.verificationStatus.coding[0].code).toBe('provisional');
    });

    it('should create Condition resources for medical history', () => {
      const answers = {
        dob: '1965-03-10',
        sex_at_birth: 'Female'
      };

      const standardized = {
        core: {
          dob: '1965-03-10',
          sex_at_birth: 'Female'
        },
        advanced: {
          illnesses: [
            { id: 'diabetes', status: 'active', year: '2010' },
            { id: 'hypertension', status: 'active', year: '2015' }
          ]
        }
      };

      const derived = {
        age_years: 59,
        bmi: { value: 26.0, category: 'Overweight' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const conditions = bundle.entry.filter(e => e.resource.resourceType === 'Condition');
      expect(conditions.length).toBeGreaterThan(0);

      const diabetesCondition = conditions.find(e => {
        const cond = e.resource as any;
        return cond.code.coding[0].display === 'diabetes';
      });
      expect(diabetesCondition).toBeDefined();
    });

    it('should create FamilyMemberHistory resources', () => {
      const answers = {
        dob: '1975-08-22',
        sex_at_birth: 'Male'
      };

      const standardized = {
        core: {
          dob: '1975-08-22',
          sex_at_birth: 'Male'
        },
        advanced: {
          family: [
            {
              relation: 'Mother',
              cancer_type: 'Breast Cancer',
              age_dx: '55'
            },
            {
              relation: 'Father',
              cancer_type: 'Lung Cancer',
              age_dx: '62'
            }
          ]
        }
      };

      const derived = {
        age_years: 49,
        bmi: { value: 25.0, category: 'Normal' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const familyHistory = bundle.entry.filter(e => e.resource.resourceType === 'FamilyMemberHistory');
      expect(familyHistory.length).toBe(2);

      const motherHistory = familyHistory.find(e => {
        const fmh = e.resource as any;
        return fmh.relationship.text === 'Mother';
      });
      expect(motherHistory).toBeDefined();
      const mother = motherHistory?.resource as any;
      expect(mother.condition[0].code.text).toBe('Breast Cancer');
      expect(mother.condition[0].onsetAge.value).toBe(55);
    });

    it('should create Immunization resources', () => {
      const answers = {
        dob: '1990-06-15',
        sex_at_birth: 'Female'
      };

      const standardized = {
        core: {
          dob: '1990-06-15',
          sex_at_birth: 'Female'
        },
        advanced: {
          screening_immunization: {
            'imm.hpv.doses': '3',
            'imm.hpv.year_last': '2008'
          }
        }
      };

      const derived = {
        age_years: 34,
        bmi: { value: 22.0, category: 'Normal' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const immunizations = bundle.entry.filter(e => e.resource.resourceType === 'Immunization');
      expect(immunizations.length).toBe(1);

      const hpvImm = immunizations[0].resource as any;
      expect(hpvImm.vaccineCode.coding[0].display).toBe('HPV vaccine');
      expect(hpvImm.protocolApplied[0].doseNumberPositiveInt).toBe(3);
      expect(hpvImm.occurrenceDateTime).toBe('2008');
    });

    it('should create Procedure resources for screenings', () => {
      const answers = {
        dob: '1960-11-30',
        sex_at_birth: 'Male'
      };

      const standardized = {
        core: {
          dob: '1960-11-30',
          sex_at_birth: 'Male'
        },
        advanced: {
          screening_immunization: {
            'screen.colon.ever': 'Yes',
            'screen.colonoscopy.date': '2020-03-15'
          }
        }
      };

      const derived = {
        age_years: 64,
        bmi: { value: 27.5, category: 'Overweight' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const procedures = bundle.entry.filter(e => e.resource.resourceType === 'Procedure');
      expect(procedures.length).toBe(1);

      const colonoscopy = procedures[0].resource as any;
      expect(colonoscopy.code.coding[0].display).toBe('Colonoscopy');
      expect(colonoscopy.performedDateTime).toBe('2020-03-15');
    });

    it('should create genetic Condition resources', () => {
      const answers = {
        dob: '1985-04-12',
        sex_at_birth: 'Female'
      };

      const standardized = {
        core: {
          dob: '1985-04-12',
          sex_at_birth: 'Female'
        },
        advanced: {
          genetics: {
            genes: ['BRCA1', 'BRCA2']
          }
        }
      };

      const derived = {
        age_years: 39,
        bmi: { value: 23.5, category: 'Normal' },
        pack_years: 0
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      const geneticConditions = bundle.entry.filter(e => {
        if (e.resource.resourceType !== 'Condition') return false;
        const cond = e.resource as any;
        return cond.code.coding.some((c: any) => c.system === 'http://www.genenames.org');
      });

      expect(geneticConditions.length).toBe(2);

      const brca1Condition = geneticConditions.find(e => {
        const cond = e.resource as any;
        return cond.code.text?.includes('BRCA1');
      });
      expect(brca1Condition).toBeDefined();
    });

    it('should create comprehensive bundle with all resource types', () => {
      const answers = { dob: '1980-01-15', sex_at_birth: 'Female' };
      const standardized = {
        core: {
          dob: '1980-01-15',
          sex_at_birth: 'Female',
          symptoms: ['HP:0033840']
        },
        advanced: {
          illnesses: [{ id: 'diabetes', status: 'active', year: '2010' }],
          family: [{ relation: 'Mother', cancer_type: 'Breast Cancer', age_dx: '55' }],
          genetics: { genes: ['BRCA1'] },
          screening_immunization: {
            'imm.hpv.doses': '3',
            'screen.colon.ever': 'Yes',
            'screen.mammo.ever': 'Yes'
          }
        }
      };
      const derived = {
        age_years: 44,
        bmi: { value: 24.5, category: 'Normal' },
        pack_years: 10,
        alcohol_audit: { score: 3, risk: 'Low Risk' },
        physical_activity_ipaq: { metMinutes: 1800, category: 'Moderate', who2020_meets: true },
        wcrf_score: { score: 2.5, max: 4.0, compliance: 'Moderate', components: {} },
        'sex.msm_behavior': false,
        'sex.hpv_exposure_band': 'Medium'
      };

      const bundle = FhirMapperService.toFhirBundle(answers, standardized, derived);

      // Verify all resource types are present
      const resourceTypes = bundle.entry.map(e => e.resource.resourceType);
      expect(resourceTypes).toContain('Patient');
      expect(resourceTypes).toContain('QuestionnaireResponse');
      expect(resourceTypes).toContain('Observation');
      expect(resourceTypes).toContain('Condition');
      expect(resourceTypes).toContain('FamilyMemberHistory');
      expect(resourceTypes).toContain('Immunization');
      expect(resourceTypes).toContain('Procedure');

      // Count observations (BMI, Pack Years, AUDIT-C, IPAQ, WCRF, HPV Band = 6)
      const observations = bundle.entry.filter(e => e.resource.resourceType === 'Observation');
      expect(observations.length).toBe(7);

      // Verify procedures (Colonoscopy + Mammography = 2)
      const procedures = bundle.entry.filter(e => e.resource.resourceType === 'Procedure');
      expect(procedures.length).toBe(2);
    });
  });
});
