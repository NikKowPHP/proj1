## **Final Implementation Plan: Questionnaire Enhancements (v2)**

This plan details the necessary steps to upgrade the Health Risk Assessor's questionnaire to version 2, introducing more detailed questions, robust validation, and an improved user experience.

### **Phase A: Foundation - Data & Schema**
*Goal: Establish the new questionnaire structure and data model as the source of truth.*

- **[x] Task A.1: Update Questionnaire Data File**
  - **File:** `src/lib/assessment-questions.json`
  - **Action:** Replace the entire content with the finalized v2 JSON structure. This structure must include the new "Medical History" step, height/weight questions, and granular lifestyle questions. Ensure question IDs are unique and descriptive (e.g., `diet_fruits_veg`, `smoking_status`).

- **[x] Task A.2: Update and Execute Database Seeder**
  - **File:** `prisma/seed.cts`
  - **Action:**
    1.  Modify the script to upsert the new content as `version: 2`.
    2.  Set `isActive: true` for version 2.
    3.  Ensure the script explicitly sets `isActive: false` for all other versions to prevent conflicts.
  - **Command:** After updating the script, run `npm run prisma:seed` to populate your development database.

### **Phase B: Backend Logic**
*Goal: Retrofit the backend services to process and validate the new, richer data payload.*

- **[x] Task B.1: Update Risk Model Configuration**
  - **File:** `src/lib/risk-model-config.json`
  - **Action:**
    1.  Add new `weights` objects for new question IDs: `smoking_status`, `diet_red_meat`, `family_history_cancer`, etc.
    2.  Add new `factors` objects for `"BODY_COMPOSITION"` and `"GENETIC_PREDISPOSITION"`.
    *(Note: Use medically-sound or placeholder weights approved for development).*

- **[x] Task B.2: Implement Server-Side Validation**
  - **File:** `src/app/api/assess/route.ts`
  - **Action:** Enhance the `answersSchema` (Zod schema) to perform strict validation on the incoming `answers` object.
    - Validate that `height` and `weight` are strings that can be coerced to numbers and are within a logical range (e.g., `z.string().transform(Number).pipe(z.number().positive())`).
    - Validate that `units` is either `'metric'` or `'imperial'`.

- **[x] Task B.3: Enhance Risk Calculator Service**
  - **File:** `src/lib/services/risk-calculator.service.ts`
  - **Action:** Modify the `calculateRisk` function:
    1.  **Unit Normalization:** Check for `answers.units`. If `'imperial'`, convert height (ft/in to m) and weight (lbs to kg) *before* any calculations.
    2.  **BMI Calculation:** Calculate BMI from the now-normalized height and weight.
    3.  **Score Calculation:** Add logic to calculate scores for the new `BODY_COMPOSITION` and `GENETIC_PREDISPOSITION` factors using the calculated BMI and new answers.

- **[x] Task B.4: Update AI Explanation Prompt**
  - **File:** `src/lib/ai/prompts/cancerRiskAssessment.prompt.ts`
  - **Action:** Update the prompt string to instruct the AI on how to sensitively and accurately explain the new risk factors, especially `GENETIC_PREDISPOSITION` and `BODY_COMPOSITION`.

### **Phase C: Frontend Integration & User Experience**
*Goal: Build a seamless and intuitive frontend to support the expanded questionnaire.*

- **[x] Task C.1: Implement Unit Selection UI**
  - **File:** `src/app/assessment/page.tsx`
  - **Action:**
    1.  Add a new state to the `useAssessmentStore` for `units: 'metric' | 'imperial'`.
    2.  In the "About You" step, add a `Tabs` component from `shadcn/ui` for "Metric" / "Imperial" selection, which updates the Zustand store.
    3.  Dynamically change the labels and placeholders for the height/weight inputs based on the selected unit.

- **[x] Task C.2: Implement New Input Types & Client-Side Validation**
  - **File:** `src/app/assessment/page.tsx`
  - **Action:**
    1.  Conditionally render an `<Input type="number" />` component when `question.type === 'number_input'`.
    2.  Add `onChange` handlers with basic validation logic (e.g., prevent non-numeric characters).
    3.  Use component state to show an error message below the input if the value is outside a reasonable range (e.g., height > 300cm). The "Next" button should be disabled until all inputs on the current step are valid.

- **[x] Task C.3: Implement Conditional Question Rendering**
  - **File:** `src/app/assessment/page.tsx`
  - **Action:** Wrap secondary questions (e.g., "How many years has it been since you quit?") in a conditional block that only renders them if the prerequisite answer is selected (e.g., `answers['smoking_status'] === 'Former smoker'`).

- **[x] Task C.4: Display Step Description for Sensitive Content**
  - **File:** `src/app/assessment/page.tsx`
  - **Action:** In the `CardHeader`, check if `stepData.description` exists. If so, render it in a styled `CardDescription` to provide context for sensitive questions like those in the "Medical History" step.

- **[x] Task C.5: Enhance UI for Sensitive Results**
  - **File:** `src/app/results/page.tsx`
  - **Action:** When rendering result `Card` components, add a conditional class: if a factor name includes "Genetic" or "History", apply a distinct style (e.g., a yellow border `border-amber-500`) to differentiate it and draw attention to the need for professional consultation.

### **Phase D: Quality Assurance**
*Goal: Verify the correctness, robustness, and usability of the entire new flow.*

- **[x] Task D.1: Update Unit Tests**
  - **File:** `src/lib/services/risk-calculator.service.test.ts`
  - **Action:** Add new `it` blocks to test the `calculateRisk` function with imperial units and with data that should trigger the new risk factors (`BODY_COMPOSITION`, `GENETIC_PREDISPOSITION`).

- **[x] Task D.2: Update End-to-End Tests**
  - **File:** `e2e/assessment.spec.ts`
  - **Action:** Modify the Playwright test script to cover the complete v2 flow:
    1.  Interact with the new unit selection `Tabs`.
    2.  Fill out all new inputs, including numbers for height/weight.
    3.  Verify that conditional questions appear/disappear correctly.
    4.  Complete the final "Medical History" step and submit.
    5.  Assert that the results page loads successfully.

- **[x] Task D.3: Perform Manual User Acceptance Testing (UAT)**
  - **Action:** Conduct a thorough manual test of the entire application.
    -  Test with valid, invalid, and edge-case data in the new inputs.
    -  Switch between units midway through a step to ensure behavior is correct.
    -  Verify the flow on both desktop and mobile screen sizes.

---
This plan provides a complete, step-by-step guide to achieving the desired enhancements. Execution in this order will ensure a smooth and logical development process.

- [x] Update `docs/app_description.md` to reflect the V2 questionnaire changes.
- [x] Add "Back to Home" navigation to static policy pages (`terms`, `privacy`, `cookies`).