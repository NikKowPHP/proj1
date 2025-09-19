
# TODO Plan: Final Alignment with `new_requirements.md`

This document outlines the remaining tasks required to fully align the application with the product specification, based on the recent gap analysis. The plan is divided into phases, prioritizing the most critical missing features and tests.

## Phase 1: High-Priority Gaps (Implement Missing Features & Add Critical Tests)

This phase focuses on completing the advanced modules and ensuring their functionality is verified through end-to-end testing.

### 1.1. Implement Comprehensive End-to-End (E2E) Tests

-   [ ] **Create E2E Test Suite for Advanced Modules:** In `e2e/assessment.spec.ts`, add new `test.describe` blocks to cover the full user flow for the following modules:
    -   [ ] **Sexual Health:** Write a test that navigates to the module, fills out all fields (including the newly added ones below), and verifies the data is correctly handled.
    -   [ ] **Environmental Exposures:** Write a test to fill out the newly added fields (industry, agriculture, water source) and ensure the conditional logic works as expected.
    -   [ ] **Labs & Imaging:** Create a test case where a user adds at least two lab/imaging entries and verifies the data is captured.
    -   [ ] **Functional Status:** Add a simple test to select an ECOG status and confirm the selection is saved.

### 1.2. Complete the Environmental & Residential Exposures Module (B10)

-   [ ] **Update Data Schema:** In `lib/assessment-questions.json`, add the following missing questions to the `environmental_exposures` module:
    -   [ ] `env.industry[]` (type: `checkbox_group`, using `Chip` component in UI).
    -   [ ] `env.agriculture` (type: `select` with Yes/No/Unsure options).
    -   [ ] `water.well_tested` (type: `select`, conditional on `water.source` being "Private well").
    -   [ ] `water.well_findings[]` (type: `checkbox_group`, conditional on `water.well_tested` being "Yes").
    -   [ ] `env.wildfire_smoke` (type: `select` with frequency options).
-   [ ] **Enhance UI Component:** Update `src/components/assessment/EnvironmentalExposures.tsx` to render these new fields with their respective conditional logic.
-   [ ] **Update Standardization Service:** In `src/lib/services/standardization.service.ts`, ensure the new answers are correctly processed and added to the `advanced.environment` block of the AI payload.

### 1.3. Complete the Sexual Health Module (B8)

-   [ ] **Update Data Schema:** In `lib/assessment-questions.json`, add the missing questions to the `sexual_health` module:
    -   [ ] `sex.anal` (type: `select` with Yes/No/Prefer not to say).
    -   [ ] `sex.oral` (type: `select` with Yes/No/Prefer not to say).
-   [ ] **Enhance UI Component:** Update `src/components/assessment/SexualHealth.tsx` to render the new `select` components for these questions.
-   [ ] **Update Standardization Service:** In `src/lib/services/standardization.service.ts`, ensure these new answers are captured within the `advanced.sexual_health` block.

---

## Phase 2: Medium-Priority Gaps (Complete Partially Implemented Features)

This phase addresses features that have been started but require enhancements to meet the specification.

### 2.1. Finalize Symptom Details Module (B1)

-   [ ] **Update UI Component:** In `src/components/assessment/SymptomDetails.tsx`:
    -   [ ] Implement the `Associated features` input using the `Chip` component with `variant="selectable"`. This should replace any existing free-text input for notes. The feature options should be passed in from the `symptomDetailsOptions` as defined in `assessment/page.tsx`.

### 2.2. Complete Screening & Immunization History Module (B6)

-   [ ] **Update Data Schema:** In `lib/assessment-questions.json`, add the missing screening definitions to the `screening_immunization` module:
    -   [ ] Define the `pap_test` group with questions `screen.pap.done` and `screen.pap.date`, making it conditional on `sex_at_birth` being "Female".
    -   [ ] Define the `psa_test` group with questions `screen.psa.done` and `screen.psa.date`, making it conditional on `sex_at_birth` being "Male".
-   [ ] **Verify UI Rendering:** Ensure `src/components/assessment/ScreeningHistory.tsx` correctly renders these new conditional sections based on the user's sex at birth.

---

## Phase 3: Low-Priority Gaps (Address Inconsistencies & Add Tests)

This phase corrects minor deviations and adds missing test coverage for backend services.

### 3.1. Correct and Verify Weight Validation Range

-   [ ] **Verify Component Logic:** In `src/app/[locale]/assessment/page.tsx`, double-check the `validateInput` function to ensure the logic for `weight_kg` enforces a minimum value of **30**.
-   [ ] **Update E2E Test:** In `e2e/features.spec.ts`, adjust the "should show validation errors" test case. Modify the assertion to check for an error when the weight is below 30 kg, and ensure no error appears at 30 kg.

### 3.2. Add Integration Test for JEM-Assist API Endpoint

-   [ ] **Create Test File:** Create `src/app/api/jobs/suggest-exposures/route.test.ts`.
-   [ ] **Write Test Cases:**
    -   [ ] Write a test that calls the API with a known job title (e.g., "welder") and asserts that it returns the correct suggested exposures (e.g., `['welding_fumes']`).
    -   [ ] Write a test that calls the API with a job title that has no ISCO code mapping and asserts it returns an empty array.
    -   [ ] Write a test that calls the API without a `jobTitle` query parameter and asserts it returns a 400 Bad Request error.