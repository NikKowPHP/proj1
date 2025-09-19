Of course. Here is a comprehensive TODO list in Markdown format, structured as a phased plan to address all identified gaps and achieve 100% alignment with the `new_requirements.md` specification.

---

# TODO Plan: Aligning Codebase with `new_requirements.md`

This document outlines the necessary tasks to fully align the application with the product specification. The plan is divided into three phases, from high-priority missing features to low-priority inconsistencies.

## Phase 1: High-Priority Gaps (Implement Missing Modules)

This phase focuses on building the advanced modules that are currently missing from the application.

### 1.1. Implement Sexual Health Module (B8)

-   [ ] **Update Data Schema:** Modify `lib/assessment-questions.json` to include the full set of questions for the `sexual_health` module.
    -   [ ] Add `sex.partner_gender` (chips).
    -   [ ] Add `sex.lifetime_partners` (select).
    -   [ ] Add `sex.last12m_partners` (select).
    -   [ ] Add `sex.sti_history` (chips with "None" as an exclusive option).
    -   [ ] Add `sex.anal` (radio).
    -   [ ] Add `sex.oral` (radio).
    -   [ ] Add `sex.barriers_practices` (radio).
-   [ ] **Enhance UI Component:** Update `src/components/assessment/SexualHealth.tsx`.
    -   [ ] Implement logic to render the new questions using `Select`, `CheckboxGroup` (for chips), and radio button components.
    -   [ ] Ensure all questions are clearly marked as optional and sensitive, per the spec.
-   [ ] **Update Standardization:** Modify `src/lib/services/standardization.service.ts` to correctly parse and structure the new sexual health answers into the `advanced.sexual_health` block of the AI payload.
-   [ ] **Write E2E Tests:** Create a new test file or add to `e2e/assessment.spec.ts` to verify the module's conditional logic, input handling, and data submission.

### 1.2. Implement Environmental & Residential Exposures Module (B10)

-   [ ] **Update Data Schema:** Add all missing questions to the `environmental_exposures` module in `lib/assessment-questions.json`.
    -   [ ] `home.postal_coarse` (masked text input).
    -   [ ] `home.year_built` (year input).
    -   [ ] `home.basement` (radio).
    -   [ ] `home.radon_value` & unit (number input + select, conditional on `radon_tested`).
    -   [ ] `home.radon_date` (year input).
    -   [ ] `home.shs_home` (radio).
    -   [ ] `home.fuels` & `home.kitchen_vent` (chips & conditional radio).
    -   [ ] `env.major_road`, `env.industry`, `env.agriculture`, `env.outdoor_uv` (selects/chips/radios).
    -   [ ] `water.source` and conditional well-testing questions.
-   [ ] **Enhance UI Component:** Update `src/components/assessment/EnvironmentalExposures.tsx` to render the comprehensive set of new questions and input types.
-   [ ] **Update Standardization:** Modify `src/lib/services/standardization.service.ts` to process these new answers into the `advanced.environment` block.
-   [ ] **Write E2E Tests:** Add tests to `e2e/assessment.spec.ts` to validate the new fields and their conditional logic.

### 1.3. Create Labs & Imaging Module (B11)

-   [ ] **Update Data Schema:** Add a new `labs_and_imaging` module to `lib/assessment-questions.json`.
-   [ ] **Create New UI Component:** Create `src/components/assessment/LabsAndImaging.tsx`.
    -   [ ] This component should manage a repeatable group of lab/imaging entries.
    -   [ ] Each entry should include fields for the study type (e.g., CBC, CT Scan), date, and a summary of the result.
-   [ ] **Integrate New Module:** Add the `LabsAndImaging` component to the `advanced_modules` section in `src/app/[locale]/assessment/page.tsx`.
-   [ ] **Update Standardization:** Update `standardization.service.ts` to handle this new data.
-   [ ] **Write E2E Tests:** Add a test case for adding and filling out at least one lab entry.

### 1.4. Create Functional Status & QoL Module (B12)

-   [ ] **Update Data Schema:** Add a new `functional_status` module to `lib/assessment-questions.json`.
    -   [ ] Include a question for `ecog` (ECOG status) with radio button options 0-4.
-   [ ] **Create New UI Component:** Create `src/components/assessment/FunctionalStatus.tsx` to render the ECOG question.
-   [ ] **Integrate New Module:** Add the new component to the main assessment page.
-   [ ] **Update Standardization:** Update `standardization.service.ts` to handle this new data.
-   [ ] **Write E2E Tests:** Add a test to verify the selection of an ECOG status.

## Phase 2: Medium-Priority Gaps (Complete Partially Implemented Features)

This phase addresses features that exist but are incomplete.

### 2.1. Enhance Symptom Details Module (B1)

-   [ ] **Update UI Component:** Modify `src/components/assessment/SymptomDetails.tsx`.
    -   [ ] Replace the static `<CardTitle>` with a searchable select component (`SearchableSelect`) for `symptom[i].code`, allowing users to refine the symptom.
    -   [ ] Replace the "Additional Notes" `<Textarea>` with a chip-based input for `Associated features` as specified.
-   [ ] **Update E2E Tests:** Modify existing tests in `e2e/assessment.spec.ts` to interact with the new searchable select and chip inputs.

### 2.2. Complete Screening & Immunization History (B6)

-   [ ] **Update Data Schema:** Add the missing screening and immunization questions to `lib/assessment-questions.json` within the `screening_immunization` module.
    -   [ ] Add questions for Pap/HPV test history (`screen.pap.done` and `screen.pap.date`).
    -   [ ] Add questions for PSA test history (`screen.psa.done` and `screen.psa.date`).
-   [ ] **Update E2E Tests:** Enhance tests to verify these new questions appear for the appropriate sex and that their data is saved.

### 2.3. Implement Data Collection for Pack-Years Calculation

-   [ ] **Update Data Schema:** In `lib/assessment-questions.json`, add the advanced smoking detail questions.
    -   [ ] Add a question for `cigs_per_day` (number input).
    -   [ ] Add a question for `years` of smoking (number input).
    -   [ ] Configure both to be conditional on `smoking_status` being "Current" or "Former".
-   [ ] **Create UI Component:** Create a new component `src/components/assessment/SmokingDetails.tsx` to house these conditional questions.
-   [ ] **Integrate Component:** Add the new `SmokingDetails` component into `src/app/[locale]/assessment/page.tsx`.
-   [ ] **Verify Data Flow:** Ensure the answers from these new questions are correctly processed by `StandardizationService` and used by `DerivedVariablesService` to calculate `pack_years`.
-   [ ] **Update Unit Tests:** Add test cases to `src/lib/services/derived-variables.service.test.ts` that use this new `smoking_detail` data structure.

## Phase 3: Low-Priority Gaps (Address Inconsistencies & Minor Fixes)

This phase corrects minor deviations from the specification.

### 3.1. Correct Validation Ranges

-   [ ] **Update Client-Side Validation:** In `src/app/[locale]/assessment/page.tsx`, adjust the validation logic for weight.
    -   Change the metric weight range check from `20-300 kg` to `30-300 kg`.
-   [ ] **Update E2E Tests:** In `e2e/features.spec.ts`, update the validation test to assert the new weight range (`30-300 kg`).

### 3.2. Implement Preliminary "Yes/No" UI Flow for Advanced Modules

-   [ ] **Personal Medical History (B4):**
    -   [ ] Add the `illness_any` (Yes/No radio) question to `lib/assessment-questions.json`.
    -   [ ] Make the `personal_medical_history` accordion module conditionally dependent on `illness_any` being "Yes".
-   [ ] **Personal Cancer History (B5):**
    -   [ ] Add the `cancer_any` (Yes/No radio) question to `lib/assessment-questions.json`.
    -   [ ] Make the `personal_cancer_history` accordion module conditionally dependent on `cancer_any` being "Yes".
-   [ ] **Occupational Hazards (B9):**
    -   [ ] Add the `job_history_enable` toggle/radio question to `lib/assessment-questions.json`.
    -   [ ] Make the `occupational_hazards` accordion module conditionally dependent on this new question.

### 3.3. Add Missing `employment_status` Field

-   [ ] **Update Data Schema:** In `lib/assessment-questions.json`, add the `employment_status` radio button question at the beginning of the `occupational_hazards` module definition.

---