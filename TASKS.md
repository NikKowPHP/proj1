# Development Plan: ONKONO Diagnostic Form - Full Spec Implementation

This document outlines the necessary tasks to evolve the ONKONO application from its current MVP state to a full implementation of the `TASKS.md` specification. The plan is divided into logical phases, starting with foundational work and progressing through feature implementation and final polish.

**Note:** This represents a significant amount of work. Tasks within each phase can be broken down further into sprints and prioritized based on clinical and business needs.

---

### Phase 1: Foundation & Scaffolding

*(Objective: Prepare the codebase for the new, complex form structure and data requirements.)*

-   [x] **Data Model & Questionnaire Structure Refactoring**
    -   [x] Restructure `assessment-questions.en.json` and `assessment-questions.pl.json` into a single, unified data source that supports the i18n schema described in spec section 'E' (e.g., `{"key": "smoking_status", "label": {"en": "...", "pl": "..."}}`).
    -   [x] Update the frontend data fetching logic (`/api/questionnaire`) to serve this new, richer format.
    -   [x] Modify the `AssessmentPage` component to dynamically render questions and options from the new structure.

-   [x] **Component Library Expansion**
    -   [x] Create or integrate a `CheckboxGroup` component for multi-select answers (e.g., for symptoms).
    -   [x] Create or integrate a `Slider` component (for 0-10 severity scores).
    -   [x] Create or integrate a `Chip` component for selectable tokens (e.g., for symptoms, exposures).
    -   [x] Create or integrate a `SearchableSelect` component for long lists (e.g., cancer types, job titles).
    -   [x] Create or integrate a `YearInput` component to simplify date entry where only the year is needed.
    -   [x] Create a `RepeatingGroup` component pattern for adding multiple entries (e.g., family members, jobs).

-   [x] **Implement Core Form Consent**
    -   [x] Add the `consent.health` checkbox to the start of the form.
    -   [x] Ensure the form submission button is disabled until this is checked.
    -   [x] Link to the privacy policy page from the consent text.

-   [x] **Codebase Cleanup**
    -   [x] Perform a global search for "Lexity" and replace all instances with "ONKONO" to ensure brand consistency.

---

### Phase 2: Core Form Parity

*(Objective: Bring the existing "Core" form up to 100% compliance with the spec.)*

-   [x] **Implement Missing Core Fields**
    -   [x] Add `intent` radio button question ("What’s your goal today?").
    -   [x] Add `source` select question ("Who is filling this form?").
    -   [x] Add `language` select question (though this is also handled by the URL).
    -   [x] Refactor `sex` field to `sex_at_birth` and add all specified options ("Female / Male / Intersex / Prefer not").
    -   [x] Add optional `gender_identity` field.
    -   [x] Add `diet_pattern` and `activity_level` fields.

-   [x] **Implement Symptom Selection (`symptoms`)**
    -   [x] Use the new `CheckboxGroup` component to display the "Red flag list" of symptoms.
    -   [x] Implement the exclusive "None" option (if "None" is checked, all other symptoms are unchecked).
    -   [x] Ensure the form requires at least one symptom or "None" to be selected to proceed.
    -   [x] **Backend:** Map selected symptoms to their corresponding HPO codes for the submission payload.

---

### Phase 3: Advanced Form Implementation

*(Objective: Build the optional, collapsible "Advanced" sections as distinct modules.)*

-   [x] **Implement "Progressive Disclosure" UX**
    -   [x] Create a main "Advanced" section container that is initially collapsed.
    -   [x] Structure each of the following modules as a collapsible card within this section.

-   [x] **B1. Symptom Details Module**
    -   [x] Conditionally display this module only if a symptom was selected in the Core form.
    -   [x] Implement fields for each selected symptom: `onset`, `severity` (slider), `frequency`, `notes`.

-   [x] **B2. Family Cancer History Module**
    -   [x] Conditionally display if `family_cancer_any=Yes`.
    -   [x] Use the `RepeatingGroup` pattern to allow adding multiple relatives.
    -   [x] For each relative, implement fields: `relation`, `cancer_type` (searchable), `age_dx`.

-   [x] **B3. Genetics Module (Sensitive)**
    -   [x] Implement all fields as specified in the table (`genetic_testing_done`, `genetic_test_type`, etc.).
    -   [x] **Critical:** Implement the `genetic_processing_consent` checkbox. Submission of this specific module must be gated by this consent.
    -   [x] Add specified tooltips and microcopy to reassure the user.

-   [x] **Implement Female-Specific Health Module (`women_section`)**
    -   [x] Conditionally show this entire module only if `sex_at_birth=Female`.
    -   [x] Add `menopause_status` question.
    -   [x] Add `menopause_age`, conditionally shown if post-menopausal.
    -   [x] Add `had_children` question.
    -   [x] Add `first_child_age`, conditionally shown if user has children.
    -   [x] Add `hrt_use` question.

-   [x] **B4. Personal Medical History Module**
    -   [x] Implement `illness_any` and the conditional `illness_list` multiselect.
    -   [x] Add sub-fields for `year`, `status`, etc., for each selected illness.

-   [x] **B5. Personal Cancer History Module**
    -   [x] Implement `cancer_any` and the conditional repeating group for cancer diagnoses.
    -   [x] Add fields for `type`, `year_dx`, and `treatments`.

-   [x] **B6. Screening & Immunization Module**
    -   [x] Implement all screening history fields (`colonoscopy`, `mammo`, etc.).
    -   [x] Implement age/sex-aware conditional logic for showing these questions.

-   [x] **B8. Sexual Health Module (Sensitive)**
    -   [x] Implement all fields for History and Practices.
    -   [x] Ensure the entire module is clearly marked as optional and is collapsed by default.
    -   [x] Ensure every sensitive question includes a "Prefer not to answer" option.

-   [x] **B9. Occupational Hazards Module**
    -   [x] Implement the `job_entries` repeating group.
    -   [x] Use the `SearchableSelect` for `job_title` (ISCO-08).
    -   [x] Use `Chip` components for `occ_exposures`.

-   [x] **B10. Environmental Exposures Module**
    -   [x] Implement all fields (`radon_tested`, `major_road` distance, etc.).
    -   [x] Add privacy-focused microcopy for the `home.postal_coarse` field.
    -   [x] Implement logic to handle radon units (Bq/m³ or pCi/L).

---

### Phase 4: Backend, Data Standardization & AI Enhancement

*(Objective: Process the new rich data correctly and enhance the AI's ability to generate a truly personalized plan.)*

-   [x] **Implement Data Standardization Engine (Backend)**
    -   [x] Create a mapping service to convert form values to standardized codes.
    -   [x] Map conditions and cancers to **SNOMED CT / ICD-O**.
    -   [x] Map measurements (height, weight) to **LOINC**.
    -   [x] Map job titles to **ISCO08**.
    -   [x] Ensure all units are stored in **UCUM** format.
    -   [x] Ensure all genetic findings are mapped to **HGNC/HGVS**.

-   [x] **Implement Server-Side Derived Variables**
    -   [x] Add logic to the `/api/assess` route to calculate `age_years` (from DOB), `bmi`, and `pack_years`.
    -   [x] Create an `organ_inventory` flag system (e.g., `has_cervix`) based on user inputs to gate screening recommendations.

-   [x] **Implement JEM Backend Logic**
    -   [x] Create a backend service that takes a job title (or ISCO08 code) and returns a list of suggested `occ_exposures`.
    -   [x] Create a new API endpoint for the frontend to call when a job title is selected.

-   [x] **Update AI Prompts and Payloads**
    -   [x] Heavily revise `preventivePlanExplainer.prompt.ts` to accept the new, complex, and coded data payload.
    -   [x] Add logic to the prompt to instruct the AI on how to interpret and explain findings from genetics, occupational hazards, family history, etc.

-   [x] **Construct Final Submission Payload**
    -   [x] Modify the `/api/assess` route to structure the final data sent to the AI according to the full envelope specified in spec section 'F'.
    -   [x] Ensure explicit `unknown` and `prefer_not` values are preserved and not collapsed to `null`.

---

### Phase 5: UI/UX, Accessibility, and Cross-Cutting Concerns

*(Objective: Implement final UI features, ensure safety and accessibility, and polish the user experience.)*

-   [x] **Implement Safety Banner Triggers**
    -   [x] On the frontend, create a list of "red flag" symptoms (e.g., hemoptysis, melena).
    -   [x] If a user selects one of these symptoms, display a non-alarming, informational banner recommending prompt medical attention.

-   [x] **Implement All Microcopy and Tooltips**
    -   [x] Systematically go through every field in the `TASKS.md` spec and add the specified UX notes, tooltips, and help text in both English and Polish.

-   [x] **Conduct Full Accessibility Audit**
    -   [x] Test the entire, completed form for WCAG 2.1 AA compliance.
    -   [x] Verify full keyboard operability for all new components (sliders, chips, etc.).
    -   [x] Test with screen readers (e.g., VoiceOver, NVDA).
    -   [x] Check color contrast and focus states.

-   [x] **End-to-End Testing**
    -   [x] Write new Playwright tests covering the advanced conditional logic paths (e.g., female-specific questions, genetics consent).
    -   [x] Manually test the full user journey on multiple mobile and desktop devices.
