# Development Plan: ONKONO Diagnostic Form - Full Spec Implementation

This document outlines the necessary tasks to evolve the ONKONO application from its current MVP state to a full implementation of the `TASKS.md` specification. The plan is divided into logical phases, starting with foundational work and progressing through feature implementation and final polish.

**Note:** This represents a significant amount of work. Tasks within each phase can be broken down further into sprints and prioritized based on clinical and business needs.

---

### Phase 1: Foundation & Scaffolding

*(Objective: Prepare the codebase for the new, complex form structure and data requirements.)*

-   [ ] **Data Model & Questionnaire Structure Refactoring**
    -   [ ] Restructure `assessment-questions.en.json` and `assessment-questions.pl.json` into a single, unified data source that supports the i18n schema described in spec section 'E' (e.g., `{"key": "smoking_status", "label": {"en": "...", "pl": "..."}}`).
    -   [ ] Update the frontend data fetching logic (`/api/questionnaire`) to serve this new, richer format.
    -   [ ] Modify the `AssessmentPage` component to dynamically render questions and options from the new structure.

-   [ ] **Component Library Expansion**
    -   [ ] Create or integrate a `CheckboxGroup` component for multi-select answers (e.g., for symptoms).
    -   [ ] Create or integrate a `Slider` component (for 0-10 severity scores).
    -   [ ] Create or integrate a `Chip` component for selectable tokens (e.g., for symptoms, exposures).
    -   [ ] Create or integrate a `SearchableSelect` component for long lists (e.g., cancer types, job titles).
    -   [ ] Create or integrate a `YearInput` component to simplify date entry where only the year is needed.
    -   [ ] Create a `RepeatingGroup` component pattern for adding multiple entries (e.g., family members, jobs).

-   [ ] **Implement Core Form Consent**
    -   [ ] Add the `consent.health` checkbox to the start of the form.
    -   [ ] Ensure the form submission button is disabled until this is checked.
    -   [ ] Link to the privacy policy page from the consent text.

-   [x] **Codebase Cleanup**
    -   [x] Perform a global search for "Lexity" and replace all instances with "ONKONO" to ensure brand consistency.

---

### Phase 2: Core Form Parity

*(Objective: Bring the existing "Core" form up to 100% compliance with the spec.)*

-   [ ] **Implement Missing Core Fields**
    -   [ ] Add `intent` radio button question ("What’s your goal today?").
    -   [ ] Add `source` select question ("Who is filling this form?").
    -   [ ] Add `language` select question (though this is also handled by the URL).
    -   [ ] Refactor `sex` field to `sex_at_birth` and add all specified options ("Female / Male / Intersex / Prefer not").
    -   [ ] Add optional `gender_identity` field.
    -   [ ] Add `diet_pattern` and `activity_level` fields.

-   [ ] **Implement Symptom Selection (`symptoms`)**
    -   [ ] Use the new `CheckboxGroup` component to display the "Red flag list" of symptoms.
    -   [ ] Implement the exclusive "None" option (if "None" is checked, all other symptoms are unchecked).
    -   [ ] Ensure the form requires at least one symptom or "None" to be selected to proceed.
    -   [ ] **Backend:** Map selected symptoms to their corresponding HPO codes for the submission payload.

---

### Phase 3: Advanced Form Implementation

*(Objective: Build the optional, collapsible "Advanced" sections as distinct modules.)*

-   [ ] **Implement "Progressive Disclosure" UX**
    -   [ ] Create a main "Advanced" section container that is initially collapsed.
    -   [ ] Structure each of the following modules as a collapsible card within this section.

-   [ ] **B1. Symptom Details Module**
    -   [ ] Conditionally display this module only if a symptom was selected in the Core form.
    -   [ ] Implement fields for each selected symptom: `onset`, `severity` (slider), `frequency`, `notes`.

-   [ ] **B2. Family Cancer History Module**
    -   [ ] Conditionally display if `family_cancer_any=Yes`.
    -   [ ] Use the `RepeatingGroup` pattern to allow adding multiple relatives.
    -   [ ] For each relative, implement fields: `relation`, `cancer_type` (searchable), `age_dx`.

-   [ ] **B3. Genetics Module (Sensitive)**
    -   [ ] Implement all fields as specified in the table (`genetic_testing_done`, `genetic_test_type`, etc.).
    -   [ ] **Critical:** Implement the `genetic_processing_consent` checkbox. Submission of this specific module must be gated by this consent.
    -   [ ] Add specified tooltips and microcopy to reassure the user.

-   [ ] **Implement Female-Specific Health Module (`women_section`)**
    -   [ ] Conditionally show this entire module only if `sex_at_birth=Female`.
    -   [ ] Add `menopause_status` question.
    -   [ ] Add `menopause_age`, conditionally shown if post-menopausal.
    -   [ ] Add `had_children` question.
    -   [ ] Add `first_child_age`, conditionally shown if user has children.
    -   [ ] Add `hrt_use` question.

-   [ ] **B4. Personal Medical History Module**
    -   [ ] Implement `illness_any` and the conditional `illness_list` multiselect.
    -   [ ] Add sub-fields for `year`, `status`, etc., for each selected illness.

-   [ ] **B5. Personal Cancer History Module**
    -   [ ] Implement `cancer_any` and the conditional repeating group for cancer diagnoses.
    -   [ ] Add fields for `type`, `year_dx`, and `treatments`.

-   [ ] **B6. Screening & Immunization Module**
    -   [ ] Implement all screening history fields (`colonoscopy`, `mammo`, etc.).
    -   [ ] Implement age/sex-aware conditional logic for showing these questions.

-   [ ] **B8. Sexual Health Module (Sensitive)**
    -   [ ] Implement all fields for History and Practices.
    -   [ ] Ensure the entire module is clearly marked as optional and is collapsed by default.
    -   [ ] Ensure every sensitive question includes a "Prefer not to answer" option.

-   [ ] **B9. Occupational Hazards Module**
    -   [ ] Implement the `job_entries` repeating group.
    -   [ ] Use the `SearchableSelect` for `job_title` (ISCO-08).
    -   [ ] Use `Chip` components for `occ_exposures`.

-   [ ] **B10. Environmental Exposures Module**
    -   [ ] Implement all fields (`radon_tested`, `major_road` distance, etc.).
    -   [ ] Add privacy-focused microcopy for the `home.postal_coarse` field.
    -   [ ] Implement logic to handle radon units (Bq/m³ or pCi/L).

---

### Phase 4: Backend, Data Standardization & AI Enhancement

*(Objective: Process the new rich data correctly and enhance the AI's ability to generate a truly personalized plan.)*

-   [ ] **Implement Data Standardization Engine (Backend)**
    -   [ ] Create a mapping service to convert form values to standardized codes.
    -   [ ] Map conditions and cancers to **SNOMED CT / ICD-O**.
    -   [ ] Map measurements (height, weight) to **LOINC**.
    -   [ ] Map job titles to **ISCO08**.
    -   [ ] Ensure all units are stored in **UCUM** format.
    -   [ ] Ensure all genetic findings are mapped to **HGNC/HGVS**.

-   [ ] **Implement Server-Side Derived Variables**
    -   [ ] Add logic to the `/api/assess` route to calculate `age_years` (from DOB), `bmi`, and `pack_years`.
    -   [ ] Create an `organ_inventory` flag system (e.g., `has_cervix`) based on user inputs to gate screening recommendations.

-   [ ] **Implement JEM Backend Logic**
    -   [ ] Create a backend service that takes a job title (or ISCO08 code) and returns a list of suggested `occ_exposures`.
    -   [ ] Create a new API endpoint for the frontend to call when a job title is selected.

-   [ ] **Update AI Prompts and Payloads**
    -   [ ] Heavily revise `preventivePlanExplainer.prompt.ts` to accept the new, complex, and coded data payload.
    -   [ ] Add logic to the prompt to instruct the AI on how to interpret and explain findings from genetics, occupational hazards, family history, etc.

-   [ ] **Construct Final Submission Payload**
    -   [ ] Modify the `/api/assess` route to structure the final data sent to the AI according to the full envelope specified in spec section 'F'.
    -   [ ] Ensure explicit `unknown` and `prefer_not` values are preserved and not collapsed to `null`.

---

### Phase 5: UI/UX, Accessibility, and Cross-Cutting Concerns

*(Objective: Implement final UI features, ensure safety and accessibility, and polish the user experience.)*

-   [ ] **Implement Safety Banner Triggers**
    -   [ ] On the frontend, create a list of "red flag" symptoms (e.g., hemoptysis, melena).
    -   [ ] If a user selects one of these symptoms, display a non-alarming, informational banner recommending prompt medical attention.

-   [ ] **Implement All Microcopy and Tooltips**
    -   [ ] Systematically go through every field in the `TASKS.md` spec and add the specified UX notes, tooltips, and help text in both English and Polish.

-   [ ] **Conduct Full Accessibility Audit**
    -   [ ] Test the entire, completed form for WCAG 2.1 AA compliance.
    -   [ ] Verify full keyboard operability for all new components (sliders, chips, etc.).
    -   [ ] Test with screen readers (e.g., VoiceOver, NVDA).
    -   [ ] Check color contrast and focus states.

-   [ ] **End-to-End Testing**
    -   [ ] Write new Playwright tests covering the advanced conditional logic paths (e.g., female-specific questions, genetics consent).
    -   [ ] Manually test the full user journey on multiple mobile and desktop devices.
