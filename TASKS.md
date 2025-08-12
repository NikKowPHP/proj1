# Plan: Expand Assessment Scope to Multiple Conditions (v2)

**Vision:** Evolve the application from a single general risk assessment to a multi-condition dashboard, providing distinct risk profiles for various cancers and other health conditions. This will be done in phases, starting with a foundational refactoring, followed by the incremental addition of new assessment modules.

**Note:** This plan proceeds with modifying the existing `/api/assess` endpoint directly, accepting the risk of breaking cached clients upon deployment to maintain a simpler codebase.

---

## Epic 1: Foundational Refactoring for Extensibility

**Goal:** Refactor the core services and data structures to support multiple, independent risk models. This is a non-negotiable first step.

### **Data Structures & Types (`src/lib/types/index.ts`)**
- [x] `[SCOPE-001]` Define a new `MultiCalculationResult` interface that contains an array of `modelResults` and a single `positiveFactors` array.
- [x] `[SCOPE-002]` Define a `ModelResult` interface within `MultiCalculationResult` to hold `modelId`, `modelName`, and `riskFactors`.

### **Configuration (`src/lib/risk-model-config.json`)**
- [x] `[SCOPE-003]` Restructure the `risk-model-config.json` file. Nest the existing `factors` and `weights` under a new top-level `models` object, with the first entry being `GENERAL_CANCER_V1`.

### **Backend Service (`src/lib/services/risk-calculator.service.ts`)**
- [x] `[SCOPE-004]` Refactor the main `calculateRisk` function into `calculateAllRisks`, which now returns the new `MultiCalculationResult` type.
- [x] `[SCOPE-005]` The `calculateAllRisks` function must loop through each model defined in `risk-config.models` and calculate its specific risks.
- [x] `[SCOPE-006]` Create a new internal helper function `calculateRiskForModel(answers, modelConfig)` to encapsulate the logic for calculating a single model's score.
- [x] `[SCOPE-007]` Refactor the positive factor logic into a separate, globally-run `identifyPositiveFactors(answers)` function.
- [x] `[SCOPE-008]` Define and implement an error handling strategy within `calculateAllRisks`. Decide whether to return partial results or fail the entire request if one model's calculation fails.

### **API Endpoint (`src/app/api/assess/route.ts`)**
- [x] `[SCOPE-009]` Modify the `POST /api/assess` route to call the new `calculateAllRisks` service and handle its new `MultiCalculationResult` structure.
- [x] `[SCOPE-010]` Update the API to pass the new `MultiCalculationResult` structure to the AI service for explanation.

### **AI Service & Prompts**
- [x] `[SCOPE-011]` Create a new prompt `getMultiRiskAssessmentPrompt` in `src/lib/ai/prompts/` that accepts the `MultiCalculationResult` JSON structure as input.
- [x] `[SCOPE-012]` Update `CompositeAIService.getRiskAssessmentExplanation` to use this new prompt and expect a synthesized JSON response from the AI.

### **Testing & QA**
- [x] `[SCOPE-013]` Create a new test file `risk-calculator.service.v2.test.ts` to validate the new multi-model calculation logic, including the partial failure strategy.
- [x] `[SCOPE-014]` Update the existing test for `POST /api/assess` to mock the new data structures and validate the refactored flow.
- [x] `[SCOPE-015]` [QA] Benchmark the end-to-end response time of the `/api/assess` endpoint after the refactoring to establish a new baseline.

---

## Epic 2: Add Lung Cancer Module (First Extension)

**Goal:** Implement the first new, end-to-end risk profile for Lung Cancer, validating the new extensible architecture.

### **Questionnaire (`src/lib/assessment-questions.json`)**
- [x] `[SCOPE-016]` Add new lung cancer-specific questions to the questionnaire (e.g., "How many years have you smoked?", "Have you been exposed to asbestos?").
- [x] `[SCOPE-017]` [UX] Review the extended questionnaire flow to mitigate user fatigue. Consider showing a more detailed progress indicator (e.g., "Section 2 of 5: Lifestyle Habits").

### **Configuration (`src/lib/risk-model-config.json`)**
- [x] `[SCOPE-018]` Add a new `LUNG_CANCER_V1` model definition to the `models` object in the config, with its own specific factors and weights.

### **Frontend UI (`src/app/results/page.tsx`)**
- [x] `[SCOPE-019]` Modify the `useRiskAssessment` hook and its consumer on the results page to handle the new API response shape containing multiple risk profiles.
- [x] `[SCOPE-020]` Redesign the results page to display multiple risk profiles. Use a `Tabs` or `Accordion` component from `shadcn/ui` to organize the results clearly.
- [x] `[SCOPE-021]` Create a new reusable component, e.g., `<RiskProfileCard />`, to display the details of a single risk profile to avoid code duplication.
- [x] `[SCOPE-022]` Update the "Recommendations" section to display synthesized advice from the AI that may cover multiple conditions.

### **Process & Documentation**
- [x] `[SCOPE-023]` [Docs] Research and document the specific, validated risk model being used as the basis for the Lung Cancer module's logic.
- [x] `[SCOPE-024]` [Process] Formal review and sign-off from a medical advisor for the new lung cancer questions and risk logic.

### **Testing & QA**
- [x] `[SCOPE-025]` Update E2E tests (`e2e/assessment.spec.ts`) to include the new lung cancer questions and verify that multiple risk cards appear on the results page.
- [x] `[SCOPE-026]` [QA] Benchmark the API response time again after adding the Lung Cancer module to check for performance degradation.

---

## Epic 3: Add Cardiovascular Disease Module & Polish

**Goal:** Add a non-cancer condition to demonstrate broader applicability and refine the user experience by providing a synthesized summary.

### **Questionnaire & Configuration**
- [ ] `[SCOPE-027]` Add new cardiovascular disease-specific questions to the questionnaire (e.g., about diabetes, known blood pressure).
- [ ] `[SCOPE-028]` [UI] Design and implement a clear UI pattern for any new optional questions (e.g., a "Skip" button or "(Optional)" text).
- [ ] `[SCOPE-029]` Add a `CARDIOVASCULAR_V1` model definition to the `risk-model-config.json`.

### **AI Prompt & Frontend UI Enhancement**
- [ ] `[SCOPE-030]` Refine the `getMultiRiskAssessmentPrompt`. Explicitly instruct the AI to provide a high-level `overallSummary` and to identify how a single user answer (like smoking) impacts multiple risk profiles.
- [ ] `[SCOPE-031]` [UI] Add an "Overall Summary" section at the top of the `results/page.tsx` to display the new `overallSummary` field from the AI response.

### **Export Functionality & Compliance**
- [ ] `[SCOPE-032]` Update `generateAssessmentPdf` in `src/lib/utils/pdf-generator.ts` to render the new multi-profile structure, including the overall summary.
- [ ] `[SCOPE-033]` Update the HTML template in `src/lib/services/email.service.ts` to correctly format the email export for multiple conditions.
- [ ] `[SCOPE-034]` [Content] Update the `Terms of Service` and `Privacy Policy` pages to reflect the assessment of multiple, specific health conditions.
- [ ] `[SCOPE-035]` [UI] Review and update all user-facing disclaimers (on the homepage, results page, and in exports) to be accurate for the newly added conditions.

### **Process & Documentation**
- [ ] `[SCOPE-036]` [Docs] Research and document the scientific basis (e.g., "Framingham Risk Score") for the Cardiovascular Disease module.
- [ ] `[SCOPE-037]` [Process] Formal medical advisor sign-off for the new cardiovascular questions and risk logic.

### **Testing & QA**
- [ ] `[SCOPE-038]` Expand E2E tests to cover the full cardiovascular assessment flow and check the PDF/email export functionality.
- [ ] `[SCOPE-039]` [QA] Final benchmark of the API response time with all three models active.
- [x] implement epic 1 