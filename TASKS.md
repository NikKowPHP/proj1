# Final Actionable To-Do List

This plan outlines the remaining tasks to achieve full compliance with the project requirements. The work is focused on completing a final advanced feature, implementing comprehensive validation, and expanding test coverage.

### Phase 1: Advanced Feature Implementation

-   [ ] **1.1. Implement Genetic Report File Upload:**
    -   **Frontend (`src/components/assessment/Genetics.tsx`):**
        -   [ ] Activate the file input for `genetic_report_upload`.
        -   [ ] Add client-side validation for file type (PDF/JPG) and size (< 10 MB).
        -   [ ] Implement logic to manage the state of the selected file.
    -   **Backend (New API Route):**
        -   [ ] Create a secure API endpoint (e.g., `/api/upload/report`) to handle the file.
        -   [ ] Implement a "process-and-delete" strategy: the file must not be stored permanently. It should be processed temporarily (e.g., assigned a temporary ID to be referenced in the AI call) and then immediately purged to maintain user anonymity.
-   [x] Add painter and other jobs/exposures to occupational hazards options in assessment-questions.json.

### Phase 2: Comprehensive Validation

-   [ ] **2.1. Enhance Client-Side Validation (`src/app/[locale]/assessment/page.tsx`):**
    -   [ ] Expand the `validateInput` function to enforce all data quality rules from Section `C` of the `new_requirements.md` document.
    -   [ ] Add range validation for `age_dx` (0-100) in the `FamilyCancerHistory` component.
    -   [ ] Add validation to ensure all year inputs (`year_dx`, `genetic_test_year`, etc.) are not in the future.
    -   [ ] Implement minimal pattern validation for the optional `genetic_variants_hgvs` field to check for basic HGVS format if a value is entered.

### Phase 3: Expanded Testing Coverage

-   [ ] **3.1. End-to-End (E2E) Tests (`e2e/assessment.spec.ts`):**
    -   [ ] **Occupational Hazards Test:** Create a new test that adds a job entry for "Welder" and asserts that the "Welding fumes" exposure chip is automatically selected via the JEM API call.
    -   [ ] **Genetics Module Test:** Write a new, detailed test that fills out every field in the Genetics accordion, verifies its conditional logic, and confirms the complex data structure is correctly managed.
    -   [ ] **Personal History Test:** Create a new test for `PersonalMedicalHistory` that adds multiple conditions and fills out their respective details to ensure the nested state is handled correctly.

-   [ ] **3.2. Unit Tests (`*.test.ts`):**
    -   [ ] **`StandardizationService` Test:** Add specific test cases to `src/lib/services/standardization.service.test.ts` to verify that raw input values (e.g., "breast", "welder", "asbestos") are correctly converted into their corresponding SNOMED, ISCO, and HGNC codes in the final output payload.
    -   [ ] **`DerivedVariablesService` Test:** Add edge-case tests to `src/lib/services/derived-variables.service.test.ts` for the `pack_years` calculation (e.g., zero cigarettes per day) and `organ_inventory` (e.g., for "Intersex" or "Prefer not to say").
      