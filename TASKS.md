# ONKONO Codebase Alignment Plan

This plan details the specific tasks required to align the `src/` codebase with the PDF specifications (ONKONO_form_specs).

## 1. Core & Biometrics Alignment
*File: `src/lib/assessment-questions.json`, `src/app/[locale]/assessment/page.tsx`*

- [x] **Adult Gate Logic:** Update `AssessmentPage.tsx` to strictly enforce the adult gate logic. If `derived.adult_gate_ok` is false, block navigation and show the specific EN/PL error message defined in PDF Page 2 ("This version of the tool is designed for adults...").
- [x] **Biometrics Soft Warnings:** Update `AssessmentPage.tsx` validation for `height_cm` and `weight_kg`.
    - **Height:** Hard range 50-250cm. **New:** Add *soft warning* if <120 or >220 ("Please check if this is correct").
    - **Weight:** Hard range 30-300kg. **New:** Add *soft warning* if <40 or >220.
- [x] **Sex at Birth:** Ensure the "Intersex" option is handled correctly in `derived-variables.service.ts` (mapped to `unknown` for screening logic as per PDF).

## 2. Lifestyle Modules (Smoking, Alcohol, Diet)
*Files: `src/components/assessment/SmokingDetails.tsx`, `src/components/assessment/GenericModule.tsx`, `src/lib/assessment-questions.json`*

- [x] **Smoking Intensity Toggle:** In `SmokingDetails.tsx`, ensure the UI allows toggling between "Cigarettes per day" and "Packs per day". The PDF specifies this toggle to normalize data to `cigs_per_day` on the backend.
- [x] **Alcohol Standard Drink Info:** Update `assessment-questions.json` for `alcohol.status` to include the specific `infoCard` definition from PDF Page 6 (10g pure ethanol examples).
- [x] **Diet - Legumes Logic:** In `assessment-questions.json`, update `dependsOn` for `diet.legumes_freq_week`.
    - **Current:** Simple dependence.
    - **PDF Requirement:** Show ONLY IF `diet.fv_portions_day < 4` **OR** `diet.whole_grains_servings_day < 1.5`. (Need to implement complex `OR` dependency logic in `GenericModule.tsx`).
- [x] **Diet - UPF Slider:** Update `diet.upf_share_pct` visibility.
    - **PDF Requirement:** Show ONLY IF `diet.fastfoods_freq_week >= 2`.

## 3. Advanced Clinical Modules
*Files: `src/components/assessment/`, `src/lib/mappings/`*

### Family History (`FamilyCancerHistory.tsx`)
- [x] **Relative Side Inference:** Ensure logic auto-fills `side_of_family` based on relation (e.g., Mother -> Maternal).
- [x] **Cancer Site List:** Verify `cancerTypes` options match the specific list on PDF Page 29 (ensure "Stomach", "Pancreas", "Melanoma" are present).
- [x] **Pattern Flags:** Ensure `derived-variables.service.ts` calculates `derived.famhx.pattern_colorectal_cluster` exactly as: "≥1 FDR with colorectal cancer <50y OR ≥2 blood relatives with colorectal on same side".

### Occupational Hazards (`OccupationalHazards.tsx`)
- [x] **Hazard List Alignment:** Update `options.exposures` in `OccupationalHazards.tsx` to match PDF Page 49 checklist exactly.
    - Ensure "Rubber, dye or chemical manufacturing" maps to `occ.hazard.rubber_chem`.
    - Ensure "Formaldehyde" and "Ionizing radiation" are present.
- [x] **Detail Row Logic:** Ensure the detail view (Job title, years, hours/week) appears for **each** selected hazard (as per PDF Page 50).

### Sexual Health (`SexualHealth.tsx`)
- [x] **Opt-in Logic:** Ensure `sexhx.section_opt_in` is the *only* visible question initially.
- [x] **MSM Flag:** In `derived-variables.service.ts`, verify `derived.sex.msm_behavior` logic:
    - Male users who select "Male" or "Both" in `sexhx.partner_genders`.
- [x] **Anal Risk Flag:** Update `derived.sex.highrisk_anal_cancer_group` to strictly follow PDF Page 14 logic (MSM + Age>=35 OR HIV OR Transplant).

## 4. Derived Variables Service Refactor
*File: `src/lib/services/derived-variables.service.ts`*

The PDF contains precise formulas that must be replicated.

- [x] **WCRF Score:** Verify `calculateWcrf` logic against PDF Page 8.
    - Component B (Fast Food): 1.0 if ≤1/wk, 0.5 if 2-3/wk.
    - Component C (Meat): 1.0 if Red ≤350g AND Processed=0.
- [x] **Lung Cancer Candidate:** Update `screen.lung_candidate` logic.
    - **PDF:** Pack-years ≥ 20 (Configurable) AND Age 50-80 (or config limits) AND (Current smoker OR Former quit <15y).
- [x] **Liver Surveillance:** Ensure `derived.hcc.surveillance_candidate` includes `cond.cirrhosis.etiology` logic (if collected) or simple `cond.cirrhosis=Yes` OR `cond.hbv.status=Chronic`.
- [x] **Skin Risk:** Update `derived.screen.skin_check_recommended`.
    - **PDF:** `skin.lymphoma_highrisk` (immunosuppression) **OR** `env.uv_high` (sunbeds) **OR** `occ.skin_uv_highrisk`.

## 5. Mappings & Codebooks
*Files: `src/lib/mappings/*.map.ts`*

- [x] **SNOMED/LOINC:** Ensure all new fields from the PDF (e.g., specific symptom HPO codes on PDF Page 15) are added to `symptom-details.map.ts` or `assessment-questions.json` IDs.
- [x] **Genetic Genes:** Update `genetic-genes.map.ts` to include any missing genes listed on PDF Page 35 (e.g., `MITF_E318K`, `RECQL` if listed).

## 6. PDF Generator Updates
*File: `src/lib/utils/pdf-generator.ts`*

- [x] **Disclaimer Text:** Update the PDF disclaimer text to match the exact EN/PL strings provided in the PDF "Microcopy" sections.
- [x] **Derived Values:** Ensure NO numeric risk scores (e.g., "WCRF Score: 3.5") are printed on the user PDF. Only print the *result* (e.g., "Lifestyle compliance: High").

## 7. UX / Microcopy (Localization)
*Files: `messages/en.json`, `messages/pl.json`*

- [x] **Standardize Helpers:** Copy the exact "Short helper" and "Tooltip" texts from the PDF columns into the i18n JSON files.
    - *Example:* For `smoking.years_smoked`, add the "decade helper" tooltip text.
    - *Example:* For `family_cancer_history`, ensure the definition of "Biological family" is visible.
