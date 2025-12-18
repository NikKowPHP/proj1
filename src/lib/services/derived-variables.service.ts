import { logger } from "@/lib/logger";
import { differenceInYears } from 'date-fns';
import clinicalConfig from '@/lib/clinical-config.json';
import { occupationalExposuresMap } from '@/lib/mappings/occupational-exposures.map';

const VERSION_TAG = "v2025.1";

// Red flag symptoms for triage
const RED_FLAGS: Record<string, string> = {
    'HP:0033840': 'Urgent: Postmenopausal bleeding',
    'HP:0002027': 'Emergency: Severe abdominal pain',
    'HP:0002015': 'Urgent: Dysphagia',
    'HP:0000790': 'Urgent: Visible Hematuria',
    'HP:0002105': 'Urgent: Hemoptysis',
    'HP:0012735': 'Urgent: Persistent cough',
    'HP:0002573': 'Urgent: Rectal bleeding',
    'HP:0002249': 'Urgent: Melena',
    'HP:0001824': 'Urgent: Unexplained weight loss',
    'HP:0030166': 'Urgent: Night sweats',
    'HP:0002653': 'Urgent: Bone pain',
    'HP:0003418': 'Urgent: Back pain (nerve)',
    'HP:0002315': 'Urgent: New headache',
    'HP:0001609': 'Urgent: Hoarseness',
    'onkn.symptom.indigestion_alarm': 'Urgent: Indigestion + alarm',
    'HP:0001031': 'Urgent: Changing mole',
    'onkn.symptom.skin_ulcer': 'Urgent: Non-healing ulcer',
    'HP:0032408': 'Urgent: Breast lump',
    'HP:0001250': 'Emergency: Seizures',
    'HP:0001324': 'Emergency: Focal weakness',
    'onkn.symptom.neuro_other': 'Urgent: Neuro changes'
};

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
 * @param dob - Date of birth in "YYYY-MM-DD" or "YYYY" format.
 * @returns The calculated age in years, or null if the input is invalid.
 */
function calculateAge(dob?: string): number | null {
    if (!dob) return null;
    // Check if dob is just a year
    if (/^\d{4}$/.test(dob)) {
        const year = parseInt(dob);
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) return null;
        return currentYear - year;
    }

    try {
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return null;
        return differenceInYears(new Date(), birthDate);
    } catch {
        return null;
    }
}

/**
 * Calculates smoking pack-years and Brinkman Index.
 * @param smokingDetails - Object with cigs_per_day, intensity_unit and years.
 * @returns Object with pack-years and brinkman_index.
 */
function calculateSmokingMetrics(smokingDetails?: { cigs_per_day?: number; intensity_unit?: string; years?: number }): { pack_years: number | null, brinkman_index: number | null } {
    if (!smokingDetails || !smokingDetails.cigs_per_day || !smokingDetails.years) {
        return { pack_years: null, brinkman_index: null };
    }
    const { cigs_per_day, intensity_unit, years } = smokingDetails;
    if (cigs_per_day <= 0 || years <= 0) return { pack_years: null, brinkman_index: null };
    
    let packsPerDay = 0;
    let cigarettesPerDay = 0;

    if (intensity_unit === 'Packs per day') {
        packsPerDay = cigs_per_day;
        cigarettesPerDay = cigs_per_day * 20;
    } else {
        packsPerDay = cigs_per_day / 20;
        cigarettesPerDay = cigs_per_day;
    }

    const pack_years = parseFloat((packsPerDay * years).toFixed(1));
    const brinkman_index = parseFloat((cigarettesPerDay * years).toFixed(1));

    return { pack_years, brinkman_index };
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
 * Calculates granular family history metrics per cancer site.
 * PDF Page 32: derived.famhx.[site].fdr_count, sdr_third_count, youngest_dx_age_any
 */
function calculateFamilySiteMetrics(familyHistory?: any[]): Record<string, any> {
    if (!familyHistory || !Array.isArray(familyHistory)) return {};

    const sites = ['breast', 'ovarian', 'colorectal', 'prostate', 'lung', 'melanoma', 'pancreas', 'gastric'];
    const metrics: Record<string, any> = {};

    const firstDegree = ['Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son'];
    const secondDegree = ['Maternal Grandmother', 'Maternal Grandfather', 'Paternal Grandmother', 'Paternal Grandfather', 'Aunt', 'Uncle', 'Niece', 'Nephew'];
    const secondAndThirdDegree = [...secondDegree, 'Cousin'];
    
    sites.forEach(site => {
        let fdrCount = 0;
        let sdrCount = 0;
        let youngestAge: number | null = null;

        familyHistory.forEach(member => {
            // Check if member has this cancer (cancers array or single cancer_type)
            const memberCancers = member.cancers || (member.cancer_type ? [{cancer_type: member.cancer_type, age_dx: member.age_dx}] : []);
            
            memberCancers.forEach((c: any) => {
                if (c.cancer_type && c.cancer_type.toLowerCase().includes(site)) {
                    // Increment counts
                    if (firstDegree.includes(member.relation)) fdrCount++;
                    else if (secondAndThirdDegree.includes(member.relation)) sdrCount++; 

                    // Track youngest age
                    const dxAge = c.age_dx;
                    if (dxAge !== undefined && dxAge !== null) {
                        if (youngestAge === null || dxAge < youngestAge) {
                            youngestAge = dxAge;
                        }
                    }
                }
            });
        });

        metrics[`famhx.${site}.fdr_count`] = fdrCount;
        metrics[`famhx.${site}.sdr_third_count`] = sdrCount;
        metrics[`famhx.${site}.youngest_dx_age_any`] = youngestAge;
    });

    return metrics;
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
    
    let risk = 'Low';
    if (score >= 11) risk = 'Possible dependence';
    else if (score >= 8) risk = 'Higher';
    else if (score >= 5) risk = 'Increasing';
    else risk = 'Low';

    return { score, risk };
}

/**
 * Calculates IPAQ Physical Activity Score.
 * @param data - Object with days/minutes for vigorous, moderate, walking.
 * @returns Object with MET-minutes and Category (Low, Moderate, High).
 */
function calculateIpaq(data?: any): { metMinutes: number, category: string, who2020_meets: boolean } | null {
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

    // WHO 2020 Guidelines: 150-300 min moderate OR 75-150 min vigorous per week
    const totalVigMinutes = vigDays * vigMin;
    const totalModMinutes = modDays * modMin + (walkDays * walkMin); // Walking counts as moderate if brisk
    
    const who2020_meets = (totalVigMinutes >= 75) || (totalModMinutes >= 150) || ((totalVigMinutes * 2 + totalModMinutes) >= 150);

    return { metMinutes: Math.round(totalMetMinutes), category, who2020_meets };
}

/**
 * Calculates WCRF Dietary/Lifestyle Compliance Score (Detailed).
 * strict thresholds based on PDF requirements.
 * 0 / 0.5 / 1.0 logic.
 */
function calculateWcrf(
    diet: any, 
    alcoholScore: number | undefined, 
    bmi: number | null, 
    ipaqCategory: string | undefined
): { score: number, max: number, compliance: string, components: any } | null {
    if (!diet) return null;
    
    // Components
    let compA = 0; // Plant Foods (FV, WG, Legumes)
    let compB = 0; // Fast Foods (Energy Dense)
    let compC = 0; // Animal Foods (Meat)
    let compD = 0; // Sugary Drinks

    // --- Component A: Plant Foods (Max 1.0) ---
    const fv = diet.vegetables || 0; // servings/day
    const wg = diet.whole_grains || 0; // servings/day
    const legumes = diet.legumes || 0; // servings/week
    
    if (fv >= 5 && wg >= 3) {
        compA = 1.0;
    } else if (fv >= 4 || wg >= 1.5 || legumes >= 3) {
        compA = 0.5;
    }

    // --- Component B: Fast Foods (Max 1.0) ---
    const fastFoodFreq = diet.fast_food || 0;
    if (fastFoodFreq <= 1) compB = 1.0;
    else if (fastFoodFreq <= 3) compB = 0.5;

    // --- Component C: Animal Foods (Max 1.0) ---
    const redMeatGwk = (diet.red_meat || 0) * 100;
    const procMeatGwk = (diet.processed_meat || 0) * 50;

    if (redMeatGwk <= 350 && procMeatGwk === 0) {
        compC = 1.0;
    } else if (redMeatGwk <= 500 && procMeatGwk <= 50) {
        compC = 0.5;
    }

    // --- Component D: Sugary Drinks (Max 1.0) ---
    const ssbFreq = diet.sugary_drinks || 0;
    const ssbSize = diet.ssb_container || 'Medium (330ml)';
    let mlPerServing = 330;
    if (ssbSize.includes('250')) mlPerServing = 250;
    if (ssbSize.includes('500')) mlPerServing = 500;
    if (ssbSize.includes('750')) mlPerServing = 750;
    const ssbMlwk = ssbFreq * mlPerServing;

    if (ssbFreq === 0) compD = 1.0;
    else if (ssbMlwk <= 250) compD = 0.5;

    // --- Total ---
    const totalScore = compA + compB + compC + compD;
    const maxScore = 4.0;

    let compliance = 'Low';
    if (totalScore >= 3.0) compliance = 'High';
    else if (totalScore >= 1.5) compliance = 'Moderate';

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
        age: f.age_dx,
        side: f.side_of_family
    }));

    // 1. Breast/Ovarian Cluster
    const breastOvarianCount = relatives.filter(r => 
        r.cancer.includes('breast') || r.cancer.includes('ovarian')
    ).length;

    // 2. Colorectal Cluster
    const firstDegree = ['Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son'];
    
    // Condition 1: FDR < 50
    const fdrYoungCrc = relatives.some(r => 
        firstDegree.includes(r.relation) && 
        (r.cancer.includes('colon') || r.cancer.includes('rectal') || r.cancer.includes('colorectal')) &&
        (r.age !== undefined && r.age < 50)
    );

    // Condition 2: 2+ on same side
    const isNuclear = (r: any) => ['Sister', 'Brother', 'Daughter', 'Son'].includes(r.relation);
    
    const isMaternalSide = (r: any) => 
        r.side === 'Maternal' || 
        r.relation === 'Mother' || 
        r.relation === 'Maternal Grandmother' || 
        r.relation === 'Maternal Grandfather' || 
        r.relation === 'Maternal Aunt' || 
        r.relation === 'Maternal Uncle' || 
        isNuclear(r);

    const isPaternalSide = (r: any) => 
        r.side === 'Paternal' || 
        r.relation === 'Father' || 
        r.relation === 'Paternal Grandmother' || 
        r.relation === 'Paternal Grandfather' || 
        r.relation === 'Paternal Aunt' || 
        r.relation === 'Paternal Uncle' || 
        isNuclear(r);

    const maternalCrc = relatives.filter(r => isMaternalSide(r) && (r.cancer.includes('colon') || r.cancer.includes('rectal') || r.cancer.includes('colorectal'))).length;
    const paternalCrc = relatives.filter(r => isPaternalSide(r) && (r.cancer.includes('colon') || r.cancer.includes('rectal') || r.cancer.includes('colorectal'))).length;
    
    const twoOrMoreCrcSameSide = (maternalCrc >= 2) || (paternalCrc >= 2); 

    const colorectalCluster = fdrYoungCrc || twoOrMoreCrcSameSide;

    // 3. Childhood or Rare Cluster
    const rareTypes = ['sarcoma', 'glioblastoma', 'adrenocortical', 'retinoblastoma', 'wilms'];
    const childhoodOrRare = relatives.some(r => 
        (r.age !== undefined && r.age < 20) || 
        rareTypes.some(t => r.cancer.includes(t))
    );

    return {
        pattern_breast_ovarian_cluster: breastOvarianCount >= 2,
        pattern_colorectal_cluster: colorectalCluster,
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
        age: f.age_dx,
        side: f.side_of_family
    }));
    
    // Lynch: Amsterdam II criteria simplified
    const lynchCancers = ['colorectal', 'endometrial', 'ovarian', 'stomach', 'pancreatic', 'biliary', 'urinary', 'brain', 'skin', 'small intestine'];
    const isNuclear = (r: any) => ['Sister', 'Brother', 'Daughter', 'Son'].includes(r.relation);

    const maternalLynch = relatives.filter(r => (r.side === 'Maternal' || isNuclear(r)) && lynchCancers.some(c => r.cancer.includes(c)));
    const paternalLynch = relatives.filter(r => (r.side === 'Paternal' || isNuclear(r)) && lynchCancers.some(c => r.cancer.includes(c)));
    
    const isLynch = maternalLynch.length >= 3 || paternalLynch.length >= 3;
    
    return {
        pattern_lynch_syndrome: isLynch
    };
}

/**
 * Checks for Occupational Risk flags.
 * PDF Page 51 Logic.
 */
function calculateOccupationalFlags(history?: any[]): Record<string, boolean> {
    if (!history || !Array.isArray(history)) return {
        'occ.lung_highrisk': false,
        'occ.mesothelioma_flag': false,
        'occ.bladder_highrisk': false,
        'occ.skin_uv_highrisk': false,
        'occ.skin_chem_highrisk': false,
        'occ.blood_cancer_flag': false,
        'occ.nasal_sinus_flag': false,
        'occ.breast_shiftwork_flag': false,
        'occ.any_highrisk': false
    };

    const config = clinicalConfig.occupational;
    const lungCarcinogens = config.lung_carcinogens;
    
    let lungRisk = false;
    let mesoFlag = false;
    let bladderRisk = false;
    let skinUvRisk = false;
    let skinChemRisk = false;
    let bloodCancerRisk = false;
    let nasalSinusRisk = false;
    let breastShiftRisk = false;
    let anyHighRisk = false; // Sum > 10 years

    let totalHighRiskYears = 0;

    history.forEach(job => {
        const possibleHazards = [...(job.occ_exposures || []), ...(job.hazards || [])]; 
        if (job.hazard) possibleHazards.push(job.hazard); 
        if (job.job_title && lungCarcinogens.includes(job.job_title.toLowerCase())) possibleHazards.push(job.job_title.toLowerCase());

        const years = job.years || 0;
        
        // 1. Lung Risk
        const hasLungCarcinogen = lungCarcinogens.some(c => possibleHazards.includes(c));
        const isCurrent = job.current === 'Yes';
        if (hasLungCarcinogen && (years >= config.high_risk_years_min || isCurrent)) {
            lungRisk = true;
        }
        
        // 2. Mesothelioma
        if (possibleHazards.includes('asbestos') && years >= 1) {
            mesoFlag = true;
        }

        // 3. Bladder
        const bladderCarcinogens = config.bladder_carcinogens;
        if (bladderCarcinogens.some(c => possibleHazards.includes(c)) && years >= config.bladder_years_min) {
            bladderRisk = true;
        }

        // 4. Skin UV
        if (possibleHazards.includes('uv_sunlight') && years >= config.high_risk_years_min) {
            skinUvRisk = true;
        }

        // 5. Skin Chem
        const skinChemCarcinogens = config.skin_chem_carcinogens;
        if (skinChemCarcinogens.some(c => possibleHazards.includes(c)) && years >= config.skin_chem_years_min) {
            skinChemRisk = true;
        }

        // 6. Blood Cancer
        const bloodCarcinogens = config.blood_carcinogens;
        if (bloodCarcinogens.some(c => possibleHazards.includes(c)) && years >= config.blood_years_min) {
            bloodCancerRisk = true;
        }

        // 7. Nasal/Sinus
        const nasalCarcinogens = config.nasal_carcinogens;
        if (nasalCarcinogens.some(c => possibleHazards.includes(c)) && years >= config.nasal_years_min) {
            nasalSinusRisk = true;
        }

        // 8. Breast Shiftwork
        if (possibleHazards.includes('shift_night') && years >= config.breast_shiftwork_years_min) {
            breastShiftRisk = true;
        }

        // Any High Risk
        if (job.hazard && job.hazard !== 'none' && job.hazard !== 'other') {
            totalHighRiskYears += years;
        }
    });

    if (totalHighRiskYears >= config.high_risk_years_min) {
        anyHighRisk = true;
    }

    return {
        'occ.lung_highrisk': lungRisk,
        'occ.mesothelioma_flag': mesoFlag,
        'occ.bladder_highrisk': bladderRisk,
        'occ.skin_uv_highrisk': skinUvRisk,
        'occ.skin_chem_highrisk': skinChemRisk,
        'occ.blood_cancer_flag': bloodCancerRisk,
        'occ.nasal_sinus_flag': nasalSinusRisk,
        'occ.breast_shiftwork_flag': breastShiftRisk,
        'occ.any_highrisk': anyHighRisk
    };
}

/**
 * Calculates HPV Exposure Band (Low/Medium/Higher).
 * Based on PDF Page 13 logic.
 */
function calculateHpvExposureBand(sexualHealth: any): string {
    if (!sexualHealth) return 'Low';

    const lifetimePartners = sexualHealth['sexhx.lifetime_partners_cat'];
    const recentPartners = sexualHealth['sexhx.partners_12m_cat'];
    const sexSitesEver = sexualHealth['sexhx.sex_sites_ever'] || [];
    const ageFirstSex = sexualHealth['sexhx.age_first_sex'];
    const sexWork = sexualHealth['sexhx.sex_work_ever'];

    const hasAnal = Array.isArray(sexSitesEver) && sexSitesEver.includes('anal');
    const isSexWork = sexWork === 'Yes';
    
    const config = clinicalConfig.risk_factors;

    // Higher
    if (
        config.hpv_partners_high.includes(lifetimePartners) || 
        config.hpv_partners_recent_high.includes(recentPartners) ||
        hasAnal ||
        isSexWork
    ) {
        return 'Higher';
    }

    // Medium
    if (
        ['2-4', '5-9'].includes(lifetimePartners) ||
        ['2-3', '4-5'].includes(recentPartners) ||
        (ageFirstSex && ageFirstSex < 18)
    ) {
        return 'Medium';
    }

    return 'Low';
}

/**
 * Calculates Genetics Flags (High/Moderate Penetrance).
 */
function calculateGeneticsFlags(genetics: any): Record<string, boolean> {
    if (!genetics || !genetics.genes) return { 
        'gen.high_penetrance_carrier': false, 
        'gen.moderate_penetrance_only': false,
        'gen.lynch_syndrome': false,
        'gen.polyposis_syndrome': false,
        'gen.prs_elevated': false
    };

    const config = clinicalConfig.genetics;
    const highPenetranceGenes = config.high_penetrance_genes;
    const moderatePenetranceGenes = config.moderate_penetrance_genes;
    const lynchGenes = config.lynch_genes;
    const polyposisGenes = config.polyposis_genes;

    const userGenes = Array.isArray(genetics.genes) ? genetics.genes : [];
    
    // Helper to check if any user selection matches a gene list
    const hasMatch = (geneList: string[]) => {
        return userGenes.some((userGene: string) => {
            if (geneList.includes(userGene)) return true;
            if (geneList.some(g => userGene.includes(g))) return true;
            if (geneList.some(g => g.includes(userGene))) return true;
            return false;
        });
    }

    const hasHigh = hasMatch(highPenetranceGenes) || userGenes.some((g:string) => g.toLowerCase().includes('lynch'));
    const hasModerate = hasMatch(moderatePenetranceGenes);
    const hasLynch = hasMatch(lynchGenes) || userGenes.some((g:string) => g.toLowerCase().includes('lynch'));
    
    const otherPolyposisGenes = polyposisGenes.filter((g: string) => g !== 'MUTYH');
    let hasPolyposis = hasMatch(otherPolyposisGenes);

    if (userGenes.includes('MUTYH')) {
        if (genetics.mutyh_biallelic === 'yes_biallelic') {
            hasPolyposis = true;
        }
    }
    
    let prsElevated = false;
    if (genetics.prs && genetics.prs.done) {
        const hasRedFlags = genetics.prs.red_flags && genetics.prs.red_flags.length > 0;
        const isHighBand = ['higher', 'mixed'].includes(genetics.prs.risk_band);
        if (hasRedFlags || isHighBand) prsElevated = true;
    }

    return {
        'gen.high_penetrance_carrier': hasHigh,
        'gen.moderate_penetrance_only': !hasHigh && hasModerate,
        'gen.lynch_syndrome': hasLynch,
        'gen.polyposis_syndrome': hasPolyposis,
        'gen.prs_elevated': prsElevated
    };
}

/**
 * Checks for hereditary cancer syndromes (Lynch, HBOC) - Legacy/Simple version
 */
function calculateFamilySyndromes(familyHistory?: any[]): string[] {
    const syndromes: string[] = [];
    const clusters = calculateFamilyClusters(familyHistory);

    if (clusters.pattern_breast_ovarian_cluster) syndromes.push('Cluster: Breast/Ovarian');
    if (clusters.pattern_colorectal_cluster) syndromes.push('Cluster: Colorectal');
    
    const relatives = familyHistory?.map(f => ({
        cancer: f.cancer_type ? f.cancer_type.toLowerCase() : '',
        age: f.age_dx
    })) || [];

    const lynchCancers = ['colorectal', 'endometrial', 'ovarian', 'stomach', 'pancreatic', 'biliary', 'urinary', 'brain', 'skin'];
    const lynchMatches = relatives.filter(r => lynchCancers.some(c => r.cancer.includes(c)));
    if (lynchMatches.length >= 3 && lynchMatches.some(r => r.age && r.age < 50)) {
        syndromes.push('Potential Lynch Syndrome');
    }

    return syndromes;
}

/**
 * Calculates symptom triage hints based on red flag symptoms.
 */
function calculateSymptomTriage(symptoms: string[]): Record<string, string | null> {
    if (!Array.isArray(symptoms)) return {};
    
    const triage: Record<string, string | null> = {};
    
    if (symptoms.includes('HP:0002653') || symptoms.includes('HP:0003418') || symptoms.includes('HP:0002315')) {
        triage['symptoms.pain.triage_hint'] = "Pain red flags present (Bone/Back/Headache)";
    }

    if (symptoms.some(s => ['HP:0002105', 'HP:0002573', 'HP:0002249', 'HP:0033840', 'HP:0000790'].includes(s))) {
        triage['symptoms.bleeding.triage_hint'] = "Bleeding red flags present";
    }

    if (symptoms.some(s => ['HP:0001250', 'HP:0001324', 'onkn.symptom.neuro_other'].includes(s))) {
        triage['symptoms.neuro.triage_hint'] = "Neurological red flags present";
    }

    const activeRedFlags = symptoms.filter(s => RED_FLAGS[s]).map(s => RED_FLAGS[s]);
    if (activeRedFlags.length > 0) {
        triage['symptoms.active_red_flags'] = activeRedFlags.join('; ');
    }

    return triage;
}

/**
 * A service to calculate derived health variables from standardized user data.
 */
export const DerivedVariablesService = {
  calculateAll: (standardizedData: Record<string, any>): Record<string, any> => {
    const derived: Record<string, any> = {
        meta: {
            version: VERSION_TAG,
            generated: new Date().toISOString()
        }
    };
    const thresholds = clinicalConfig.screening_thresholds;

    try {
      const core = standardizedData.core || {};
      const advanced = standardizedData.advanced || {};
      const prophylaxis = advanced.prophylactic_surgery || {};

      // Age
      const age = calculateAge(core.dob);
      if (age !== null) {
          derived.age_years = age;
          derived.adult_gate_ok = age >= 18;
          if (age >= 18 && age <= 29) derived.age_band = "18-29";
          else if (age >= 30 && age <= 39) derived.age_band = "30-39";
          else if (age >= 40 && age <= 44) derived.age_band = "40-44";
          else if (age >= 45 && age <= 49) derived.age_band = "45-49";
          else if (age >= 50 && age <= 54) derived.age_band = "50-54";
          else if (age >= 55 && age <= 59) derived.age_band = "55-59";
          else if (age >= 60 && age <= 69) derived.age_band = "60-69";
          else if (age >= 70) derived.age_band = "70+";
      } else {
          derived.adult_gate_ok = false; 
      }

      // BMI
      const bmi = calculateBmi(core.height_cm, core.weight_kg);
      if (bmi) {
        derived.bmi = { value: bmi, unit: "kg/m2", code: "39156-5" };
        derived.flags = derived.flags || {};
        derived.flags.bmi_obesity = bmi >= 30;
      }
      
      // Symptom Triage
      const symptoms = core.symptoms || [];
      const symptomTriage = calculateSymptomTriage(symptoms);
      Object.assign(derived, symptomTriage);
      
      // Diet
      if (typeof core.diet?.red_meat === 'number') derived.red_meat_gwk = core.diet.red_meat * 100;
      if (typeof core.diet?.processed_meat === 'number') derived.proc_meat_gwk = core.diet.processed_meat * 50;
      if (typeof core.diet?.sugary_drinks === 'number') {
          const freq = core.diet.sugary_drinks;
          const sizeType = core.diet.ssb_container || 'Medium (330ml)';
          let mlPerServing = 330;
          if (sizeType.includes('250')) mlPerServing = 250;
          if (sizeType.includes('500')) mlPerServing = 500;
          if (sizeType.includes('750')) mlPerServing = 750;
          derived.ssb_mLwk = freq * mlPerServing;
      }

      // Smoking
      if (core.smoking_status === 'Never') {
          derived.pack_years = 0;
          derived.brinkman_index = 0;
      } else if (core.smoking_status === 'Former' || core.smoking_status === 'Current') {
        const { pack_years, brinkman_index } = calculateSmokingMetrics(advanced.smoking_detail);
        if (pack_years !== null) derived.pack_years = pack_years;
        if (brinkman_index !== null) derived.brinkman_index = brinkman_index;
        
        const currentYear = new Date().getFullYear();
        const quitYear = advanced.smoking_detail?.quit_date;
        if (core.smoking_status === 'Former' && quitYear) {
            derived.smoking_years_since_quit = currentYear - quitYear;
        }
      }
      
      // Organ Inventory
      if(core.sex_at_birth === 'Female') {
          derived.sex_category = "female_at_birth";
          const surgs = prophylaxis.type || [];
          const hasHysterectomy = surgs.includes('Hysterectomy');
          const hasOophorectomy = surgs.includes('Oophorectomy');
          const hasMastectomy = surgs.includes('Mastectomy');
          derived.organ_inventory = {
              has_cervix: !hasHysterectomy,
              has_uterus: !hasHysterectomy,
              has_ovaries: !hasOophorectomy,
              has_breasts: !hasMastectomy
          }
      } else if (core.sex_at_birth === 'Male') {
          derived.sex_category = "male_at_birth";
          derived.organ_inventory = { has_prostate: true, has_breasts: true }
      } else if (core.sex_at_birth === 'Intersex') {
          derived.sex_category = "intersex";
      } else {
          derived.sex_category = "unknown";
      }

      // Family History
      const earlyDx = calculateEarlyAgeFamilyDx(advanced.family);
      if (earlyDx !== null) derived.early_age_family_dx = earlyDx;
      
      const famClusters = calculateFamilyClusters(advanced.family);
      const syndromeFlags = calculateSyndromeFlags(advanced.family);
      Object.assign(derived, famClusters, syndromeFlags);

      const siteMetrics = calculateFamilySiteMetrics(advanced.family);
      Object.assign(derived, siteMetrics);

      // ADDED: Family History Aggregates
      const familyHistory = advanced.family || [];
      const bloodRelativesWithCancer = familyHistory.filter((f: any) => f.is_blood_related !== false && (f.cancer_type || (f.cancers && f.cancers.length > 0))).length;
      derived['famhx.total_blood_relatives_with_cancer'] = bloodRelativesWithCancer;

      const firstDegree = ['Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son'];
      const hasFdrCancer = familyHistory.some((f: any) => f.is_blood_related !== false && firstDegree.includes(f.relation) && (f.cancer_type || (f.cancers && f.cancers.length > 0)));
      derived['famhx.first_degree_any'] = hasFdrCancer;

      // Occupational
      const exposures = calculateExposureComposites(advanced.occupational);
      if (exposures !== null) derived.exposure_composites = exposures;
      const occFlags = calculateOccupationalFlags(advanced.occupational);
      Object.assign(derived, occFlags);

      // --- Sexual Health Flags ---
      const sexHistory = advanced.sexual_health || {};
      const sexAtBirth = core.sex_at_birth;

      // ADDED: sex.opted_out
      derived['sex.opted_out'] = sexHistory['sexhx.section_opt_in'] === 'No' || sexHistory['sexhx.section_opt_in'] === 'Prefer not to say';

      let msmBehavior = false;
      const partnerGenders = sexHistory['sexhx.partner_genders'];
      
      if (sexAtBirth === 'Male') {
          if (Array.isArray(partnerGenders)) {
             if (partnerGenders.some((g: string) => 
                g === 'Only men' || g === 'Men and women' || g.toLowerCase() === 'male' || g.toLowerCase() === 'same sex'
             )) msmBehavior = true;
          } else if (typeof partnerGenders === 'string') {
             if (
                partnerGenders === 'Only men' || partnerGenders === 'Men and women' || 
                partnerGenders.toLowerCase() === 'male' || partnerGenders.toLowerCase() === 'both' || 
                partnerGenders.toLowerCase() === 'same sex'
             ) msmBehavior = true;
          }
      }
      derived['sex.msm_behavior'] = msmBehavior;

      // High Risk Anal Cancer Group - CORRECTED LOGIC
      const illnesses = advanced.illnesses || []; 
      const hasHiv = illnesses.some((i: any) => i.id === 'hiv');
      const hasTransplant = illnesses.some((i: any) => i.id === 'transplant');
      const meds = advanced.medications_iatrogenic || {};
      const hasImmunosuppression = meds.immunosuppression_now === 'Yes';
      const sexSitesEver = sexHistory['sexhx.sex_sites_ever'] || [];
      const hasAnalReceptive = Array.isArray(sexSitesEver) && sexSitesEver.includes('anal'); // Logic assumes specific option ID
      const hpvPrecancer = sexHistory['sexhx.hpv_precancer_history'] || [];
      const hasAnalPrecancer = Array.isArray(hpvPrecancer) && hpvPrecancer.includes('Anus');

      // (derived.sex.msm_behavior = true AND user_age ≥ 35)
      const condition1 = msmBehavior && derived.age_years >= 35;
      // (cond.hiv.status ≠ Never AND (derived.sex.anal_receptive_ever = true OR derived.sex.msm_behavior = true))
      const condition2 = hasHiv && (hasAnalReceptive || msmBehavior);
      // (cond.tx.status = Yes OR meds.immunosupp.current = Yes) AND derived.sex.anal_receptive_ever = true
      const condition3 = (hasTransplant || hasImmunosuppression) && hasAnalReceptive;
      // (sexhx.hpv_precancer_sites includes “Anus”)
      const condition4 = hasAnalPrecancer;

      derived['sex.highrisk_anal_cancer_group'] = condition1 || condition2 || condition3 || condition4;

      derived['sex.hpv_exposure_band'] = calculateHpvExposureBand(sexHistory);
      
      const sexOral = sexHistory['sex_oral'];
      const lifetimePartners = sexHistory['sexhx.lifetime_partners_cat'];
      const recentPartners = sexHistory['sexhx.partners_12m_cat'];
      if (sexOral === 'Yes' && (
          ['5-9', '10-19', '20+', '20 or more'].includes(lifetimePartners) || 
          ['2-3', '4-5', '6+', '6 or more'].includes(recentPartners)
      )) {
          derived['sex.oral_hpvcancer_exposure'] = true;
      } else {
          derived['sex.oral_hpvcancer_exposure'] = false;
      }
      
      const hpvPrecancerHistory = sexHistory['sexhx.hpv_precancer_history'] || [];
      const hpvPrecancerCervix = Array.isArray(hpvPrecancerHistory) && hpvPrecancerHistory.includes('Cervix');
      const hpvStatus = illnesses.find((i: any) => i.id === 'hpv');
      const hpvPersistent = hpvStatus && (hpvStatus.status === 'Past' || hpvStatus.status === 'Current');
      const hasCervix = derived.organ_inventory?.has_cervix;
      
      if (hasCervix && derived['sex.hpv_exposure_band'] === 'Higher' && (hpvPrecancerCervix || hpvPersistent)) {
          derived['sex.cervix_hpv_persistent_pattern'] = true;
      } else {
          derived['sex.cervix_hpv_persistent_pattern'] = false;
      }

      // ADDED: flag.sex.recent_sti
      derived['flag.sex.recent_sti'] = sexHistory['sexhx.sti_treated_12m'] === 'Yes';

      // --- Chronic Condition Surveillance Flags ---
      const hasCirrhosis = illnesses.some((i: any) => i.id === 'cirrhosis');
      const hasActiveHbv = illnesses.some((i: any) => i.id === 'hbv' && i.status === 'Current');
      const hasIbd = illnesses.some((i: any) => i.id === 'ibd');
      const hasPsc = illnesses.some((i: any) => i.id === 'psc');
      const hasBarretts = illnesses.some((i: any) => i.id === 'barretts'); 
      
      // --- Personal Cancer History Flags ---
      const personalCancerHistory = advanced.personal_cancer_history || [];

      // ADDED: Num primaries and Multiple primaries
      const distinctCancers = personalCancerHistory.length;
      derived['ca.num_primaries'] = distinctCancers;
      derived['ca.multiple_primaries'] = distinctCancers >= 2;

      // ADDED: ca.colorectal_history
      const hasPersonalCrc = personalCancerHistory.some((c: any) => {
          const t = c.type?.toLowerCase() || '';
          return t.includes('colon') || t.includes('rectal') || t.includes('colorectal');
      });
      derived['ca.colorectal_history'] = hasPersonalCrc;

      // ADDED: Childhood Survivor
      const childhoodSurvivor = personalCancerHistory.some((cancer: any) => cancer.age_at_dx !== undefined && cancer.age_at_dx < 21);
      derived['ca.childhood_survivor'] = childhoodSurvivor;

      const youngOnsetBreastGyn = personalCancerHistory.some((cancer: any) => {
        const gynSites = ['breast', 'ovarian', 'endometrial', 'cervical', 'ovary', 'uterine'];
        const isGynSite = gynSites.some(site => cancer.type?.toLowerCase().includes(site));
        return isGynSite && cancer.age_at_dx !== undefined && cancer.age_at_dx <= 45;
      });
      derived['ca.young_onset_breast_gyn'] = youngOnsetBreastGyn;

      const chestRtLt30 = personalCancerHistory.some((cancer: any) => {
        const hasRt = Array.isArray(cancer.treatments_modalities) && 
                      cancer.treatments_modalities.includes('Radiotherapy');
        const rtRegion = cancer.rt?.region;
        const rtAge = cancer.rt?.age_first;
        const isChestRt = rtRegion && (
          rtRegion.toLowerCase().includes('chest') ||
          rtRegion.toLowerCase().includes('breast') ||
          rtRegion.toLowerCase().includes('mediastin') ||
          rtRegion.toLowerCase().includes('thorax')
        );
        return hasRt && isChestRt && rtAge !== undefined && rtAge < 30;
      });
      derived['ca.chest_rt_lt30'] = chestRtLt30;

      // ADDED: Pelvic RT
      const pelvicRtAny = personalCancerHistory.some((cancer: any) => {
        const hasRt = Array.isArray(cancer.treatments_modalities) && 
                      cancer.treatments_modalities.includes('Radiotherapy');
        const rtRegion = cancer.rt?.region;
        const isPelvicRt = rtRegion && (
          rtRegion.toLowerCase().includes('abdomen') ||
          rtRegion.toLowerCase().includes('pelvis')
        );
        return hasRt && isPelvicRt;
      });
      derived['ca.pelvic_rt_any'] = pelvicRtAny;

      const hsctSurvivor = personalCancerHistory.some((cancer: any) => {
        const hsctType = cancer.hsct?.type;
        return hsctType === 'autologous' || hsctType === 'allogeneic';
      });
      derived['ca.hsct_survivor'] = hsctSurvivor;

      // ADDED: Longterm Endocrine
      const totalEndoYears = personalCancerHistory.reduce((sum: number, cancer: any) => {
          return sum + (cancer.endo_years_total || 0);
      }, 0);
      derived['ca.longterm_endocrine'] = totalEndoYears >= 5;

      // ADDED: Prophylactic Surgery Flag
      const prophylacticAny = prophylaxis.any === 'Yes';
      const hasGynProphylactic = personalCancerHistory.some((c: any) => c.surgery?.gyn_prophylactic === 'Yes');
      derived['ca.prophylactic_surgery_flag'] = prophylacticAny || hasGynProphylactic;

      // ADDED: Hereditary Pattern Possible
      // Logic: multiple_primaries OR young_onset_breast_gyn OR (childhood_survivor AND another adult cancer) OR prophylactic_surgery OR genetic_flag
      const hasGeneticFlag = personalCancerHistory.some((c: any) => c.genetic_flag === true);
      const childhoodPlusAdult = childhoodSurvivor && distinctCancers >= 2; // Approximation: if childhood survivor and has 2+ cancers, one is likely adult/later
      derived['ca.hereditary_pattern_possible'] = derived['ca.multiple_primaries'] || youngOnsetBreastGyn || childhoodPlusAdult || derived['ca.prophylactic_surgery_flag'] || hasGeneticFlag;


      // --- HCC Surveillance Logic ---
      let ibdLongDuration = false;
      if (hasIbd) {
          const ibdEntry = illnesses.find((i: any) => i.id === 'ibd');
          if (ibdEntry && ibdEntry.year && derived.age_years) {
              const currentYear = new Date().getFullYear();
              if ((currentYear - ibdEntry.year) >= thresholds.hcc_ibd_years_min) ibdLongDuration = true;
          }
      }

      derived['hcc.surveillance_candidate'] = hasCirrhosis || hasActiveHbv;
      derived['crc.ibd_surveillance'] = (hasIbd && ibdLongDuration) || hasPsc;
      derived['barrett.surveillance'] = hasBarretts;
      derived['skin.lymphoma_highrisk'] = hasImmunosuppression || hasTransplant;
      derived['hpv_related.vigilance'] = hasHiv || hasImmunosuppression;

      // --- Environmental Flags ---
      const env = advanced.environment || {};
      const envSummary = env['env.summary'] ? JSON.parse(env['env.summary']) : [];
      
      const sunburnChild = Number(env['env.uv.sunburn_child']) || 0;
      const sunburnAdult = Number(env['env.uv.sunburn_adult']) || 0;
      const sunbedFreq = env['env.uv.sunbed_use'];
      
      const isSunbedUser = ['Occasional (10-50)', 'Frequent (>50)'].includes(sunbedFreq);
      const radonResult = env['env.radon.level_cat']; 
      const radonHighOptions = clinicalConfig.risk_factors.radon_high_options;
      const isRadonHigh = radonResult && radonHighOptions.includes(radonResult);
      
      // ADDED: environmental flags
      const airYears = Number(env['env.air.high_pollution_years']) || 0;
      derived['env.air_longterm_high'] = airYears >= 10;

      const shsDetails = advanced.smoking_detail?.shs || {};
      const shsHome = shsDetails.home_freq;
      const shsWork = shsDetails.work_freq;
      const shsNone = (shsHome === 'Never' || !shsHome) && (shsWork === 'Never' || !shsWork);
      derived['shs.none_flag'] = shsNone;

      derived['env.radon_high'] = isRadonHigh || (envSummary.includes('radon') && env['env.radon.tested'] !== 'No' && env['env.radon.level_cat'] && radonHighOptions.some((o:string) => env['env.radon.level_cat'].includes(o)));
      derived['env.asbestos_unprotected'] = env['env.asbestos.disturbance'] === 'Yes - multiple' || env['env.asbestos.disturbance'] === 'Yes - once';
      derived['env.well_contam_flag'] = env['env.water.well_contam_notice'] === 'Yes';
      derived['env.solidfuel_longterm'] = env['env.indoor.solidfuel_years'] >= 10;
      
      const pesticideFreq = Number(env['env.pesticide.use_freq_year']);
      const pesticideYears = Number(env['env.pesticide.years_use']);
      const pesticideProtection = env['env.pesticide.protection'];
      derived['env.pesticide_intensive'] = !isNaN(pesticideFreq) && !isNaN(pesticideYears) && pesticideFreq >= 12 && pesticideYears >= 5 && pesticideProtection !== 'Almost always';
      derived['env.uv_high'] = sunburnChild >= 3 || sunburnAdult >= 5 || isSunbedUser;

      // ADDED: derived.env.any_high_count
      const envFlags = [
          derived['occ.lung_highrisk'], 
          derived['env.radon_high'],
          derived['env.asbestos_unprotected'],
          derived['env.well_contam_flag'],
          derived['env.pesticide_intensive'],
          derived['env.uv_high'],
          derived['env.solidfuel_longterm'],
          derived['env.air_longterm_high']
      ];
      derived['env.any_high_count'] = envFlags.filter(Boolean).length;
      
      // --- Screening Candidate Flags ---
      const currentYear = new Date().getFullYear();
      const quitYear = advanced.smoking_detail?.quit_date;
      const yearsSinceQuit = quitYear ? (currentYear - quitYear) : 0;

      derived['screen.lung_candidate'] = (
          derived.pack_years >= thresholds.lung_pack_years_min && 
          derived.age_years >= thresholds.lung_age_min && 
          derived.age_years <= thresholds.lung_age_max && 
          (core.smoking_status === 'Current' || (core.smoking_status === 'Former' && yearsSinceQuit <= thresholds.lung_quit_years_max))
      );
      
      derived['screen.prostate_discuss'] = (core.sex_at_birth === 'Male' && derived.age_years >= thresholds.prostate_age_min);
      
      // --- Screening Due Flags ---
      const screening = advanced.screening_immunization || {};

       const skinSymptoms = ['HP:0001031', 'onkn.symptom.skin_ulcer'];
       const hasSkinSymptom = standardizedData.core?.symptoms?.some((s: string) => skinSymptoms.includes(s));
       const hasBiopsyHistory = screening['screen.skin.biopsy_ever'] === 'Yes';
       
       derived['screen.skin_check_recommended'] = derived['skin.lymphoma_highrisk'] || derived['env.uv_high'] || derived['occ.skin_uv_highrisk'] || hasSkinSymptom || hasBiopsyHistory;

      const ageBand = derived.age_band || '';
      const isBreastEligible = core.sex_at_birth === 'Female';

      const lastPapYear = screening['screen.cervix.last_year'] ?? screening['screen.cervical.year'];
      const lastMammoYear = screening['screen.breast.mammo_last_year'] ?? screening['screen.mammogram.year'];
      const lastCrcYear = screening['screen.crc.last_year'] ?? screening['screen.colon.year'];

      const yearsSince = (year?: number) =>
        typeof year === 'number' ? currentYear - year : Number.POSITIVE_INFINITY;

      derived['screen.cervix_due'] =
        Boolean(hasCervix) &&
        ['30-39', '40-44', '45-49', '50-54', '55-59', '60-69'].includes(ageBand) &&
        (yearsSince(lastPapYear) >= thresholds.cervix_years_since);

      derived['screen.breast_due'] =
        isBreastEligible &&
        ['40-44', '45-49', '50-54', '55-59', '60-69'].includes(ageBand) &&
        (yearsSince(lastMammoYear) >= thresholds.breast_years_since);

      const crcHighRisk =
        (advanced.illnesses || []).some((i: any) => i.id === 'ibd') ||
        derived['crc.ibd_surveillance'];
      const crcInterval = crcHighRisk ? thresholds.crc_interval_years_high_risk : thresholds.crc_interval_years_standard;

      derived['screen.crc_due'] =
        derived.age_years !== undefined &&
        derived.age_years >= thresholds.crc_age_min &&
        (yearsSince(lastCrcYear) >= crcInterval);

      derived['screen.any_overdue'] =
        derived['screen.cervix_due'] ||
        derived['screen.breast_due'] ||
        derived['screen.crc_due'] ||
        derived['screen.hcc_surveillance_due'];

      // --- Immunization Status Flags ---
      const imm = screening;
      const hpvDoses = Number(imm['imm.hpv.doses']);
      const hpvComplete = Number.isFinite(hpvDoses) ? (hpvDoses >= (derived.age_years && derived.age_years < 15 ? 2 : 3)) : false;
      derived['imm.hpv_complete'] = hpvComplete;
      derived['imm.hbv_complete'] = imm['imm.hbv.completed'] === 'Yes';
      derived['imm.flu_due'] = imm['imm.flu.last_season'] !== 'Yes';
      derived['imm.covid_booster_due'] = imm['imm.covid.doses'] !== '4+'; // Simplified logic
      
      const chronicConditions = illnesses.map((i: any) => i.id);
      const pneumoRiskConditions = [
          'cond.copd', 'diabetes', 'cirrhosis', 'hiv', 
          'transplant', 'meds.immunosupp.current' 
      ];
      const hasPneumoRiskCondition = pneumoRiskConditions.some(c => chronicConditions.includes(c)) || hasImmunosuppression || (illnesses.some((i:any) => i.id === 'transplant'));

      derived['imm.pneumo_candidate'] = derived.age_years >= 65 || core.smoking_status === 'Current' || hasPneumoRiskCondition;
      derived['imm.zoster_candidate'] = derived.age_years >= 50;
      
      const partners12m = sexHistory['sexhx.partners_12m_cat'];
      derived['sex.multiple_partners_12m'] = ['2-3', '4-5', '6 or more', '6+'].includes(partners12m);

      const tetanusYear = imm['imm.td_tdap.year_last'];
      if (tetanusYear) {
          derived['imm.tetanus_booster_due'] = (currentYear - tetanusYear) >= thresholds.tetanus_booster_years;
      } else {
          derived['imm.tetanus_booster_due'] = false; 
      }

      // AUDIT-C
      const audit = calculateAuditC(core.alcohol_audit, core.sex_at_birth);
      if (audit) derived.alcohol_audit = audit;

      // IPAQ
      const ipaq = calculateIpaq(core.physical_activity);
      if (ipaq) {
          derived.physical_activity_ipaq = ipaq;
          derived['pa.who2020_meets'] = ipaq.who2020_meets;
          derived['pa.sedentary_minutes'] = core.physical_activity?.sitting_min;
      }

      // WCRF
      const wcrf = calculateWcrf(core.diet, audit?.score, bmi || null, ipaq?.category);
      if (wcrf) derived.wcrf_score = wcrf;

      // Genetics Flags
      const genFlags = calculateGeneticsFlags(advanced.genetics);
      Object.assign(derived, genFlags);

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
