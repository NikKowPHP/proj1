
# Implementation Plan: Closing Gaps for v2.0 Requirements

This document outlines the necessary tasks to align the application with the `new_requirements.md` specification. The tasks are prioritized to focus on implementing missing core functionality first, followed by enhancements to existing modules and backend updates.

## Priority 1: Implement Critical Missing Modules

### 1.1. Create Screening & Immunization History Module
*   **Goal:** Implement the full `Screening & Immunization History` module as per section `B6` of the specification. This is a high-priority gap as it contains essential data for the guideline engine.
*   **Tasks:**
    - [ ] **Update `lib/assessment-questions.json`:** Add the complete data structure for the "Screening & Immunization" advanced module, including all nested questions for colonoscopy, mammogram, Pap/HPV tests, PSA tests, and immunizations.
    - [ ] **Modify `src/components/assessment/ScreeningHistory.tsx`:** Overhaul the existing component to render the new, detailed structure.
        - [ ] Implement conditional logic based on age and `sex_at_birth`.
        - [ ] Add `done` (Yes/No) and `date` (`YearInput`) fields for each screening type.
        - [ ] Add fields for `imm.hpv` and `imm.hbv` immunizations.
    - [ ] **Connect to Assessment Flow:** Ensure the new module is correctly rendered in `src/app/[locale]/assessment/page.tsx` within the "Advanced Details" accordion.

### 1.2. Create Medications / Iatrogenic Module
*   **Goal:** Implement the `Medications / Iatrogenic` module as per section `B7`. This module is small but contains important factors for the AI model.
*   **Tasks:**
    - [ ] **Update `lib/assessment-questions.json`:** Add a new advanced module definition for "Medications & Exposures".
    - [ ] **Create New Component `src/components/assessment/Medications.tsx`:**
        - [ ] Add a radio button input for `immunosuppression.now` (Yes/No/Unsure).
        - [ ] Add a conditional short text input for `immunosuppression.cause`.
    - [ ] **Integrate into Assessment:** Add the new `Medications` component to the "Advanced Details" accordion in `src/app/[locale]/assessment/page.tsx`.
    - [ ] **Verify HRT Field:** Confirm that the `female.hrt_use` field within `FemaleHealth.tsx` is sufficient and does not need to be moved. The current placement is logical.

## Priority 2: Complete Partially Implemented Modules

### 2.1. Enhance Symptom Details Module
*   **Goal:** Add the missing fields to the `Symptom Details` component to fully align with section `B1`.
*   **Files to Modify:** `src/components/assessment/SymptomDetails.tsx`
*   **Tasks:**
    - [ ] **Change Onset Input:** Replace the current `onset` dropdown (e.g., "<1week") with a proper `Date/Month/Year` input. A simple `YearInput` and a `Select` for the month would suffice if a full date picker is too complex.
    - [ ] **Add Notes Field:** Implement the `symptom[i].notes` field, which should allow the user to select from a list of HPO-coded "Associated features" using the `Chip` component.

### 2.2. Enhance Personal Medical History Module
*   **Goal:** Add the missing "Clinician-confirmed" field to align with section `B4`.
*   **Files to Modify:** `src/components/assessment/PersonalMedicalHistory.tsx`
*   **Tasks:**
    - [ ] **Add `confirmed` Field:** Inside the repeatable group for each illness, add a `Select` or radio button group for the `illness[i].confirmed` field with options "Yes" and "No".
    - [ ] **Update State:** Ensure the `onDetailChange` handler correctly saves this new field's state.

### 2.3. Enhance Functional Status Module
*   **Goal:** Add the optional Quality of Life questionnaire field to align with section `B12`.
*   **Files to Modify:** `src/components/assessment/FunctionalStatus.tsx`
*   **Tasks:**
    - [ ] **Add `qlq_c30` Field:** Implement an optional, collapsible section or a link to a sub-form for the `qlq_c30` (EORTC QLQ-C30) Likert scale questions. Given its complexity, this could start as a placeholder or a simple "I would like to complete this" checkbox.

## Priority 3: Align Core Form with Specification

### 3.1. Update Age Input to Date of Birth
*   **Goal:** Replace the age-range `Select` with a `Date of Birth` input as specified in section `A` to enable precise age calculation.
*   **Files to Modify:**
    *   `lib/assessment-questions.json`
    *   `src/app/[locale]/assessment/page.tsx`
*   **Tasks:**
    - [ ] **Modify `lib/assessment-questions.json`:** Change the question with `"id": "age"` to `"id": "dob"` and `"type": "date_input"`.
    - [ ] **Update `assessment/page.tsx`:** Ensure the component correctly renders a date input for the `dob` question. Implement validation to prevent future dates.
    - [ ] **Verify `DerivedVariablesService`:** Confirm that the service at `src/lib/services/derived-variables.service.ts` is already correctly using a `dob` field to calculate `age_years`. No changes should be needed there.

## Priority 4: Update Backend Services

### 4.1. Update Standardization Service
*   **Goal:** Ensure the backend can process the new data from the implemented and updated modules.
*   **Files to Modify:** `src/lib/services/standardization.service.ts`
*   **Tasks:**
    - [ ] **Add Screening History:** Update the `standardize` method to process and structure the data from the new Screening & Immunization module.
    - [ ] **Add Medications Data:** Add logic to handle the new `immunosuppression` fields.
    - [ ] **Add QoL Data:** Add logic to handle the new `qlq_c30` data from the Functional Status module.
    - [ ] **Update Medical History:** Ensure the new `confirmed` status for personal illnesses is correctly processed.

### 4.2. Update Derived Variables Service
*   **Goal:** Enhance the service to make use of new, detailed data points.
*   **Files to Modify:** `src/lib/services/derived-variables.service.ts`
*   **Tasks:**
    - [ ] **Refine Organ Inventory:** Update the `calculateAll` method to use data from the (newly implemented) Screening History module. For example, if a user reports a hysterectomy or oophorectomy, the `organ_inventory` flags (`has_cervix`, `has_uterus`, `has_ovaries`) should be set to `false`.