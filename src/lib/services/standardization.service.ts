import { logger } from "@/lib/logger";
import { cancerTypesMap } from "@/lib/mappings/cancer-types.map";
import { jobTitlesMap } from "@/lib/mappings/job-titles.map";
import { medicalConditionsMap } from "@/lib/mappings/medical-conditions.map";
import { occupationalExposuresMap } from "@/lib/mappings/occupational-exposures.map";
import { environmentalExposuresMap } from "@/lib/mappings/environmental-exposures.map";

const safeJsonParse = (value: any): any[] => {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
    return [];
  } catch (e) {
    return [];
  }
};

export const StandardizationService = {
  standardize: (answers: Record<string, any>): Record<string, any> => {
    const standardized: { core: Record<string, any>, advanced: Record<string, any> } = {
      core: {},
      advanced: {},
    };

    try {
      const parseYear = (value: any): number | undefined => {
        if (value === null || value === undefined || value === '') return undefined;
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return undefined;
        if (numeric < 1900 || numeric > new Date().getFullYear() + 1) return undefined;
        return numeric;
      };

      const setScreeningYear = (answersKey: string, targetKeys: string[]) => {
        const raw = answers[answersKey];
        if (raw === undefined || raw === null || raw === '') return;
        const parsed = parseYear(raw);
        targetKeys.forEach((key) => {
          screeningImmunization[key] = parsed ?? raw;
        });
      };

      // --- CORE SECTION ---
      standardized.core = {
        dob: answers.dob, // Year only now
        sex_at_birth: answers.sex_at_birth,
        height_cm: Number(answers.height_cm) || undefined,
        weight_kg: Number(answers.weight_kg) || undefined,
        smoking_status: answers.smoking_status,
        alcohol_status: answers['alcohol.status'],
        alcohol_former_since: Number(answers['alcohol.former_since']) || undefined,
        
        // Alcohol (AUDIT-C) - UPDATED KEYS
        alcohol_audit: {
            q1: Number(answers['auditc.q1_freq']),
            q2: Number(answers['auditc.q2_typical']),
            q3: Number(answers['auditc.q3_6plus']),
        },
        symptoms: safeJsonParse(answers.symptoms),
        family_cancer_any: answers['famhx.any_family_cancer'], // UPDATED KEY
        
        // Diet (WCRF FFQ) - UPDATED KEYS
        diet: {
            vegetables: Number(answers['diet.fv_portions_day']),
            red_meat: Number(answers['diet.red_meat_servings_week']), 
            processed_meat: Number(answers['diet.processed_meat_servings_week']),
            sugary_drinks: Number(answers['diet.ssb_servings_week']),
            whole_grains: Number(answers['diet.whole_grains_servings_day']),
            fast_food: Number(answers['diet.fastfoods_freq_week']),
            legumes: Number(answers['diet.legumes_freq_week']),
            upf_share: Number(answers['diet.upf_share_pct']),
            ssb_container: answers['diet.ssb_container'],
        },
        
        // Physical Activity (IPAQ) - UPDATED KEYS
        physical_activity: {
            vigorous_days: Number(answers['pa.vig.days7']),
            vigorous_min: Number(answers['pa.vig.minperday']),
            moderate_days: Number(answers['pa.mod.days7']),
            moderate_min: Number(answers['pa.mod.minperday']),
            walking_days: Number(answers['pa.walk.days7']),
            walking_min: Number(answers['pa.walk.minperday']),
            sitting_min: Number(answers['pa.sit.min_day']),
        },
      };

      // --- ADVANCED SECTION ---
      
      // Symptom Details
      const symptomDetails: Record<string, any> = {};
      standardized.core.symptoms.forEach((symptomId: string) => {
        const detailKey = `symptom_details_${symptomId}`;
        if (answers[detailKey]) {
          symptomDetails[symptomId] = safeJsonParse(answers[detailKey]);
        }
      });
      if (Object.keys(symptomDetails).length > 0) {
        standardized.advanced.symptom_details = symptomDetails;
      }
      
      // Family History - UPDATED KEYS
      if (answers.family_cancer_history) {
        const familyHistory = safeJsonParse(answers.family_cancer_history);
        standardized.advanced.family = familyHistory.map((member: any) => ({
          ...member,
          cancer_code: cancerTypesMap[member.cancer_type] || undefined,
        }));
      }
      
      // Genetics - UPDATED KEYS
      if (['yes_report', 'yes_no_details'].includes(answers['gen.testing_ever'])) {
        standardized.advanced.genetics = {
          tested: true,
          type: safeJsonParse(answers['gen.test_type']), // Now a checkbox group
          year: answers['gen.test_year_first'],
          findings_present: answers['gen.path_variant_self'] === 'Yes',
          variant_self_status: answers['gen.path_variant_self'],
          genes: answers['gen.self_genes'] ? JSON.parse(answers['gen.self_genes']) : [],
          // Map to internal structure
          variants_hgvs: null, // Removed from new JSON spec
        };
      }
      
      // PRS
      if (answers['gen.prs_done'] && answers['gen.prs_done'].includes('Yes')) {
          standardized.advanced.genetics = {
              ...standardized.advanced.genetics,
              prs: {
                  done: true,
                  // No specific flags in new JSON, mostly just "done" for now based on spec
                  risk_band: 'unknown' 
              }
          }
      }

      // Illnesses (cond.summary)
      let illnessList = answers['cond.summary'];
      if (typeof illnessList === 'string') {
          illnessList = safeJsonParse(illnessList);
      } else if (!Array.isArray(illnessList)) {
          illnessList = [];
      }

      if (illnessList.length > 0) {
          standardized.advanced.illnesses = illnessList.map((illnessId: string) => {
              const details: any = {};
              
              // Mapped using new keys
              if (illnessId === 'hbv') {
                  details.status = answers['cond.hbv.status'];
                  details.antiviral = answers['cond.hbv.antiviral_now'];
              }
              if (illnessId === 'hcv') {
                  details.status = answers['cond.hcv.status'];
                  details.svr12 = answers['cond.hcv.svr12'];
              }
              if (illnessId === 'cirrhosis') details.etiology = answers['cond.cirr.etiology'];
              if (illnessId === 'ibd') {
                  details.type = answers['cond.ibd.type'];
                  details.extent = answers['cond.ibd.extent'];
                  details.year = parseYear(answers['cond.ibd.year_dx']);
              }
              if (illnessId === 'diabetes') details.type = answers['cond.t2dm.status'] === 'Yes' ? 'Type 2' : 'Unknown';

              return {
                  id: illnessId,
                  code: medicalConditionsMap[illnessId] || undefined,
                  ...details
              };
          });
      }

      // Personal Cancer History
      if (answers.personal_cancer_history) {
        const personalCancerHistory = safeJsonParse(answers.personal_cancer_history);
        standardized.advanced.personal_cancer_history = personalCancerHistory.map((cancer: any) => ({
          ...cancer,
          type_code: cancerTypesMap[cancer.type] || undefined,
        }));
      }

       // Occupational History
      if (answers.occupational_hazards) {
        const occupationalHistory = safeJsonParse(answers.occupational_hazards);
        standardized.advanced.occupational = occupationalHistory.map((entry: any) => {
          return {
             hazard: entry.hazardId,
             hazard_code: occupationalExposuresMap[entry.hazardId] || undefined,
             job_title: entry.main_job_title,
             isco: jobTitlesMap[entry.main_job_title] || undefined,
             years: entry.years_total,
             hours_week: entry.hours_per_week,
             year_first: entry.year_first_exposed,
             current: entry.current_exposure,
             ppe: entry.ppe_use,
             occ_exposures: entry.occ_exposures // Map specific exposures if present
          };
        });
      }
      
      // Screening and Immunization - UPDATED KEYS
      const screeningImmunization: Record<string, any> = {};
      const rawScreeningKeys = [
        'screen.colonoscopy.date',
        'screen.crc.last_result',
        'screen.crc.followup_interval',
        'screen.colon.type',
        'screen.colon.ever',
        'screen.colon.year',
        'screen.mammo.date',
        'screen.mammogram.year',
        'screen.breast.mammo_last_result',
        'screen.cervical.ever',
        'screen.cervical.year',
        'screen.pap.date',
        'screen.cervix.last_type',
        'screen.cervix.last_result',
        'screen.psa.date',
        'screen.prostate.psa_abnormal',
        'screen.lung.ldct_last_year',
        'screen.lung.ldct_last_result',
        'screen.hcc.us_last_year',
        'screen.upper_endo.last_year',
        'imm.hpv.doses',
        'imm.hbv.completed',
        'imm.hav.any',
        'imm.flu.last_season',
        'imm.covid.doses',
        'imm.td_tdap.year_last',
        'imm.pneumo.ever',
        'imm.zoster.ever',
        'imm.zoster.vaccine_type',
        'screen.skin.biopsy_ever',
        'screen.other.list',
        'imm.other_list',
      ];

      rawScreeningKeys.forEach((key) => {
        if (answers[key] !== undefined && answers[key] !== null && answers[key] !== '') {
          screeningImmunization[key] = answers[key];
        }
      });

      // Map screen.summary to legacy ever flags
      const screenSummary = safeJsonParse(answers['screen.summary']);
      if (screenSummary.length > 0) {
        if (screenSummary.includes('Colonoscopy')) screeningImmunization['screen.colon.ever'] = 'Yes';
        if (screenSummary.includes('Mammogram')) screeningImmunization['screen.mammo.ever'] = 'Yes';
        if (screenSummary.includes('Pap/HPV')) screeningImmunization['screen.pap.ever'] = 'Yes';
        if (screenSummary.includes('PSA')) screeningImmunization['screen.psa.ever'] = 'Yes';
        if (screenSummary.includes('Lung CT')) screeningImmunization['screen.lung.ever'] = 'Yes';
        if (screenSummary.includes('Skin Exam')) screeningImmunization['screen.skin.ever'] = 'Yes';
        if (screenSummary.includes('Liver Ultrasound')) screeningImmunization['screen.liver.ever'] = 'Yes';
        if (screenSummary.includes('Upper Endoscopy')) screeningImmunization['screen.ued.ever'] = 'Yes';
      }

      // Normalize key mismatches between questionnaire and downstream logic
      setScreeningYear('screen.colon.year', ['screen.colon.year', 'screen.crc.last_year']);
      setScreeningYear('screen.cervical.year', ['screen.cervical.year', 'screen.cervix.last_year']);
      setScreeningYear('screen.mammogram.year', ['screen.mammogram.year', 'screen.breast.mammo_last_year']);
      setScreeningYear('screen.colonoscopy.date', ['screen.colonoscopy.date', 'screen.crc.last_year']);
      setScreeningYear('screen.mammo.date', ['screen.mammo.date', 'screen.breast.mammo_last_year']);
      setScreeningYear('screen.pap.date', ['screen.pap.date', 'screen.cervix.last_year']);
      setScreeningYear('screen.lung.ldct_last_year', ['screen.lung.ldct_last_year']);
      setScreeningYear('screen.psa.date', ['screen.psa.date']);
      setScreeningYear('screen.hcc.us_last_year', ['screen.hcc.us_last_year']);
      setScreeningYear('screen.upper_endo.last_year', ['screen.upper_endo.last_year']);
      
      if (Object.keys(screeningImmunization).length > 0) {
        standardized.advanced.screening_immunization = screeningImmunization;
      }

      // Sexual Health - UPDATED KEYS
      const sexualHealth: Record<string, any> = {};
      const sexualHealthKeys = [
          'sexhx.section_opt_in',
          'sexhx.ever_sexual_contact',
          'sexhx.partner_genders', 
          'sexhx.lifetime_partners_cat',
          'sexhx.partners_12m_cat', 
          'sexhx.condom_use_12m',
          'sexhx.sti_history_other', 
          'sexhx.new_partner_12m',
          'sexhx.age_first_sex',
          'sexhx.sex_sites_ever',
          'sexhx.sex_sites_12m',
          'sexhx.sex_work_ever',
          'sexhx.sex_work_role',
          'sexhx.sti_treated_12m',
          'sexhx.hpv_precancer_history'
      ];
      
      sexualHealthKeys.forEach(key => {
        if (answers[key]) {
             if (['sexhx.partner_genders', 'sexhx.sex_sites_ever', 'sexhx.sex_sites_12m', 'sexhx.sex_work_role', 'sexhx.hpv_precancer_history'].includes(key) && answers[key].startsWith('[')) {
                 sexualHealth[key] = safeJsonParse(answers[key]);
             } else {
                 sexualHealth[key] = answers[key];
             }
        }
      });
      if (Object.keys(sexualHealth).length > 0) {
        // Extract oral sex flag for derived variables (C-02 fix)
        // The oral HPV cancer exposure logic needs this as a simple Yes/No field
        if (Array.isArray(sexualHealth['sexhx.sex_sites_ever']) && 
            sexualHealth['sexhx.sex_sites_ever'].includes('Oral sex')) {
          sexualHealth['sex_oral'] = 'Yes';
        } else if (sexualHealth['sexhx.sex_sites_ever'] !== undefined) {
          sexualHealth['sex_oral'] = 'No';
        }
        
        standardized.advanced.sexual_health = sexualHealth;
      }

      // Environmental Exposures - UPDATED KEYS
      // Functional Status
      const functional: Record<string, any> = {};
      if (answers['func.falls_last_year']) {
          // Config expects "Yes" for "func.falls_last_year", do not convert to Number
          functional.falls_last_year = answers['func.falls_last_year'];
      }
      if (Object.keys(functional).length > 0) {
          standardized.advanced.functional = functional;
      }

      const environmental: Record<string, any> = {};
      const envKeys = [
          'env.summary',
          'env.air.high_pollution_years', 'env.air.current_high',
          'env.indoor.solidfuel_years', 'env.indoor.solidfuel_ventilation',
          'env.radon.tested', 'env.radon.level_cat', 'env.radon.mitigation',
          'env.asbestos.home_status', 'env.asbestos.disturbance',
          'env.water.main_source_10y', 'env.water.well_contam_notice',
          'env.pesticide.use_freq_year', 'env.pesticide.years_use', 'env.pesticide.protection',
          'env.uv.sunbed_use', 'env.uv.sunburn_child', 'env.uv.sunburn_adult'
      ];
      
      envKeys.forEach(key => {
          if (answers[key]) {
              environmental[key] = answers[key];
          }
      });

      if (answers['env.summary']) {
          const envList = safeJsonParse(answers['env.summary']);
          environmental.coded_exposures = envList.map((id: string) => ({
              id: id,
              code: environmentalExposuresMap[id] || undefined
          })).filter((item: any) => item.id !== 'none');
      }

      if (Object.keys(environmental).length > 0) {
        standardized.advanced.environment = environmental;
      }

      // Smoking Details - UPDATED KEYS
      const smokingDetails: any = {
          pattern: answers['smoking.pattern'],
          start_age: Number(answers['smoking.start_age']) || undefined,
          cigs_per_day: Number(answers['smoking.intensity']) || undefined,
          intensity_unit: answers['smoking.intensity_unit'],
          years: Number(answers['smoking.years_smoked']) || undefined,
          quit_date: parseYear(answers['smoking.quit_date'] ? String(answers['smoking.quit_date']).split('-')[0] : undefined),
          other_tobacco: safeJsonParse(answers['smoking.other_tobacco_smoked']),
          vape: {
              status: answers['vape.status'],
              days_30d: Number(answers['vape.days_30d']) || undefined,
              nicotine: answers['vape.nicotine'],
          },
          htp: {
              status: answers['htp.status'],
              sticks_day: Number(answers['htp.sticks_per_day']) || undefined,
          },
          shs: {
              home_freq: answers['shs.home_freq'],
              work_freq: answers['shs.work_freq'],
          }
      };

      const cleanObject = (obj: any): any => {
         Object.keys(obj).forEach(key => {
             if (obj[key] && typeof obj[key] === 'object') cleanObject(obj[key]);
             else if (obj[key] === undefined) delete obj[key];
         });
         return obj;
      };

      standardized.advanced.smoking_detail = cleanObject(smokingDetails);

    } catch (error) {
      logger.error("Failed to standardize answers", {
        error,
        answers,
      });
    }

    return standardized;
  }
};