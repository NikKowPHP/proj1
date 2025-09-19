Of course. Here is a detailed and atomic TODO list in Markdown format to address all identified gaps and bring the codebase to 100% compliance with the `new_requirements.md` specification.

---

### Atomic Plan for 100% Compliance

This plan is broken down into logical sections. Completing these tasks will resolve all identified discrepancies between the current implementation and the new requirements.

#### 1. Backend: Core Logic & Guideline Expansion

*(This is the highest priority section. The value of new UI components is limited until the backend can process and act on the data they collect.)*

-   [x] **Expand Guideline Rule Engine Capabilities:**
    -   [x] Modify the `checkCondition` function in `src/lib/services/guideline-engine.service.ts` to support an `array_contains` operator for checking values within arrays (e.g., for gene lists or occupational exposures).
-   [x] **Add New Guideline Rules for Genetics:**
    -   [x] In `src/lib/preventive-plan-config.en.json`, add a rule for `GENETIC_COUNSELING_REFERRAL` that triggers if `standardized.advanced.genetics.genes` contains `BRCA1` or `BRCA2`.
    -   [x] Add a similar rule for Lynch Syndrome genes (`MLH1`, `MSH2`, etc.).
    -   [x] Replicate these new rules with Polish values in `src/lib/preventive-plan-config.pl.json`.
-   [x] **Add New Guideline Rules for Family History:**
    -   [x] In `src/lib/preventive-plan-config.en.json`, add a rule that triggers a recommendation for earlier screening (e.g., `EARLY_COLORECTAL_SCREENING`) if the (yet-to-be-created) `derived.early_age_family_dx` flag is `true`.
    -   [x] Replicate this rule in `src/lib/preventive-plan-config.pl.json`.
-   [x] **Add New Guideline Rules for Occupational Hazards:**
    -   [x] In `src/lib/preventive-plan-config.en.json`, modify the `LUNG_CANCER_SCREENING` rule to also consider occupational exposures like `asbestos` in addition to smoking history.
    -   [x] Add a new rule for `DERMATOLOGY_CONSULT_BENZENE` that triggers for specific chemical exposures.
    -   [x] Replicate these rules in `src/lib/preventive-plan-config.pl.json`.

#### 2. Backend: Standardization & Derived Variables

-   [x] **Implement `personal_cancer_history` Standardization:**
    -   [x] In `src/lib/services/standardization.service.ts`, add a new block to process the `personal_cancer_history` answer. It should parse the JSON string and structure it under `standardized.advanced.personal_cancer_history`.
-   [x] **Implement New Derived Variables:**
    -   [x] In `src/lib/services/derived-variables.service.ts`, create a new function to calculate `early_age_family_dx`. This function should iterate through `standardized.advanced.family` and return `true` if any first-degree relative has an `age_dx` less than 50.
    -   [x] In the same service, create a function to calculate `exposure_composites`. For now, this can be a simple flag (e.g., `has_known_carcinogen_exposure: true`) if `standardized.advanced.occupational.occ_exposures` contains high-risk items like `asbestos` or `benzene`.
-   [x] **Capture `quit_year` for Smokers:**
    -   [x] In `src/lib/services/standardization.service.ts`, update the `smoking_detail` block to also process the `quit_year` field from the form answers.
-   [x] **Process QLQ-C30 Functional Status Data:**
    -   [x] In `src/lib/services/standardization.service.ts`, expand the `functional_status` block to process the new Likert scale answers from the EORTC QLQ-C30 questions.

#### 3. Frontend: Component & Schema Updates

-   [x] **Implement Full Functional Status Module:**
    -   [x] In `src/lib/assessment-questions.json`, replace the single `qlq_c30_consent` checkbox with the actual set of EORTC QLQ-C30 Likert scale questions as specified. Each should be a `select` or `slider` type.
    -   [x] Update the `FunctionalStatus.tsx` component in `src/components/assessment/FunctionalStatus.tsx` to render these new, detailed questions when the module is expanded.
-   [x] **Enhance Labs & Imaging Module:**
    -   [x] In `src/components/assessment/LabsAndImaging.tsx`, modify the `RepeatingGroup` item to include new `Input` fields for "Result Value" and a `Select` for "Units" (e.g., mg/dL, IU/L).
    -   [x] Update the component's state and `onChange` handler to manage these new fields.
    -   [x] In `src/lib/assessment-questions.json`, update the `labs_and_imaging` module definition to reflect these more detailed fields.
-   [x] **Add `quit_year` Field to UI:**
    -   [x] In `src/lib/assessment-questions.json`, add a new `year_input` question with the ID `quit_year` to the `smoking_details` module.
    -   [x] Ensure its `dependsOn` logic makes it appear only when `smoking_status` is "Former".
    -   [x] Update `src/components/assessment/SmokingDetails.tsx` to correctly render this new field.
-   [x] **Implement UI Tooltips:**
    -   [x] In `src/app/[locale]/assessment/page.tsx`, modify the question rendering logic to check for a `q.tooltip` property.
    -   [x] If a tooltip exists, wrap the `Label` with `TooltipProvider`, `Tooltip`, and `TooltipTrigger` from `shadcn/ui`, adding an `Info` icon next to the label.
    -   [x] In `src/lib/assessment-questions.json`, add `tooltip` text to at least three complex questions in the Genetics module (e.g., for "pathogenic variants," "HGVS," and "VUS").

#### 4. AI & Prompt Engineering

-   [ ] **Expand AI Prompt Content Map:**
    -   [ ] In `src/lib/ai/prompts/preventivePlanExplainer.prompt.ts`, add detailed instructions to the "SPECIFIC ACTION ID CONTENT MAP" section for the new rules created in step 1 (e.g., `GENETIC_COUNSELING_REFERRAL`, `EARLY_COLORECTAL_SCREENING`, `DERMATOLOGY_CONSULT_BENZENE`).
    -   [ ] Update the main prompt to instruct the AI to personalize explanations by referencing new derived variables like `derived.early_age_family_dx` and data from `standardized.advanced.genetics`.

#### 5. Code Cleanup & Refinement

-   [ ] **Resolve Medication Component Discrepancy:**
    -   [ ] Decide on a single implementation path: either enhance and use the `src/components/assessment/Medications.tsx` component for the "Medications / Iatrogenic" section or remove the unused component file.
    -   [ ] If keeping the component, refactor the questions in `src/lib/assessment-questions.json` to use this dedicated component. If not, delete `src/components/assessment/Medications.tsx`.
      