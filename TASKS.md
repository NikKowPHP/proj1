### **Phase 0: Pre-Development (Prerequisites)**

*   [x] **[ADDITION] Task 0: Finalize Medical Logic and Parameters**
    *   **Action:** Work with the medical advisor to get the **exact, finalized calculation logic** for each risk factor. This must include:
        *   The specific questions that influence a risk score.
        *   The numerical points or weighting for each answer.
        *   The formulas for combining scores.
        *   The score thresholds for classifying risk as `Low`, `Average`, or `Higher than Average`.
    *   **Output:** A definitive document or spreadsheet that a developer can implement without ambiguity. **(This is a hard blocker for Phase 1).**

---

### **Phase 1: Backend Refactoring**

This phase focuses on creating the new calculation engine and rewiring the API and AI services to use it.

*   [x] **Task 1: Define Data Contracts in `types.ts`**
    *   **File:** `src/lib/types/index.ts`
    *   **Action:** Define the `CalculationResult` interface that the new engine will produce. This object will be the "source of truth" passed to the AI.

*   [x] **[ADDITION] Task 2: Create Risk Model Configuration**
    *   **File:** Create a new file `src/lib/risk-model-config.json` (or similar).
    *   **Action:** Translate the finalized medical logic from the Pre-Development phase into a structured JSON configuration. This file will contain all the numerical weights, thresholds, and mappings. The code will read from this file.

*   [ ] **Task 3: Create the Deterministic Calculation Engine**
    *   **File:** Create a new file `src/lib/services/risk-calculator.service.ts`.
    *   **Action:** Implement the risk calculation logic. This service will **load its parameters from `risk-model-config.json`** and apply them to the user's answers.

*   [ ] **Task 4: Create Unit Tests for the Calculation Engine**
    *   **File:** Create a new test file `src/lib/services/risk-calculator.service.test.ts`.
    *   **Action:** Write comprehensive unit tests for the `calculateRisk` function to ensure its accuracy.
    *   **Test Cases:** Test with "low-risk", "high-risk", and edge-case answer sets to verify the output matches the medical advisor's specification.

*   [ ] **Task 5: Refactor the AI Prompt**
    *   **File:** `src/lib/ai/prompts/cancerRiskAssessment.prompt.ts`
    *   **Action:** Rewrite the prompt. The new prompt will **receive** the `CalculationResult` and be asked to **explain** it, not calculate it.

*   [ ] **Task 6: Refactor the Composite AI Service**
    *   **File:** `src/lib/ai/composite-ai.service.ts`
    *   **Action:** Rename `getRiskAssessment(answers)` to `getRiskAssessmentExplanation(calculationResult: CalculationResult)` and update it to use the new prompt.

*   [ ] **Task 7: Orchestrate the Hybrid Flow in the API Route**
    *   **File:** `src/app/api/assess/route.ts`
    *   **Action:** Rewire the handler to use the new hybrid flow:
        1.  Receive `answers` from the client.
        2.  Call `calculateRisk(answers)` to get a `CalculationResult`.
        3.  Pass this `CalculationResult` object to `aiService.getRiskAssessmentExplanation()`.
        4.  Return the final, user-friendly JSON from the AI to the client after Zod validation.

---

### **Phase 2: Testing & Verification**

This phase ensures that the refactored system works correctly from end to end.

*   [ ] **Task 1: Update API Integration Tests**
    *   **File:** The Jest test file for `/api/assess/route.ts`.
    *   **Action:**
        *   Mock the `risk-calculator.service`.
        *   Assert that `calculateRisk` is called correctly.
        *   Assert that `getRiskAssessmentExplanation` is called with the mock output from the calculator.

*   [ ] **Task 2: Update End-to-End Tests**
    *   **File:** `e2e/assessment.spec.ts`
    *   **Action:** Update the `page.route()` mock for the `/api/assess` endpoint to return the final JSON structure that the new hybrid approach produces.

*   [ ] **[ADDITION] Task 3: Staging Environment Verification**
    *   **Action:** Deploy the completed changes to a private staging environment.
    *   **Action:** Have the client and, most importantly, the **medical advisor**, perform a User Acceptance Test (UAT) on the staging environment. They must verify that the results for a variety of inputs are accurate and communicated correctly.

*   [ ] **Task 4: Final Review and Deployment**
    *   **Action:** Manually test the full flow one last time.
    *   **Action:** Merge the changes into the main branch for production deployment.