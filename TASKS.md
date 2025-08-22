### **Project: "Proactive Health Planner" - Implementation Plan** ONKONO

#### **Phase 1: Foundational Reframing & Content Update**
*(Goal: Update all user-facing text and documentation to reflect the new "preventive plan" mission. This is primarily content changes.)*

*   **Project Naming & Messaging:**
    *   `[x]` **[messages/en.json]** Update `HomePage.title` to "Proactive Health Planner" or similar.
    *   `[x]` **[messages/en.json]** Update `HomePage.description` to focus on building a "preventive care roadmap."
    *   `[x]` **[messages/en.json]** Update `HomePage.ctaButton` to "Build My Preventive Plan."
    *   `[x]` **[messages/pl.json]** Apply the same content updates for the Polish translations.
    *   `[x]` **[package.json]** Update the `name` and `description` fields.
    *   `[x]` **[next.config.ts]** Update any metadata related to the site title/description.
    *   `[x]` **[public/manifest.json]** Update `name` and `short_name`.

*   **Questionnaire Framing:**
    *   `[x]` **[lib/assessment-questions.en.json]** Revise `title` and `description` for each step to frame it as gathering information for a plan, not assessing risk.
    *   `[x]` **[lib/assessment-questions.pl.json]** Apply the same framing revisions for Polish questions.

*   **Static Pages & Footer:**
    *   `[x]` **[messages/en.json]** Review and update `PrivacyPage` and `TermsPage` content to ensure it aligns with the new mission (e.g., explicitly state no risk scores are calculated).
    *   `[x]` **[messages/pl.json]** Apply the same review and updates for Polish static pages.

#### **Phase 2: Backend Logic Overhaul (The Rules Engine)**
*(Goal: Replace the risk scoring system with a deterministic engine that generates a list of recommended actions based on established guidelines.)*

*   **Configuration:**
    *   `[x]` **Create `preventive-plan-config.en.json`:** Design a new JSON structure for defining screening/guideline rules. Each rule should have conditions (e.g., `age >= 40`, `smoking_status: "Current smoker"`) and an associated action ID (e.g., `RECOMMEND_MAMMOGRAM`).
    *   `[x]` **Create `preventive-plan-config.pl.json`:** Create the Polish equivalent of the new config file.
    *   `[x]` **Delete `risk-model-config.en.json`:** Remove the old risk scoring configuration.
    *   `[x]` **Delete `risk-model-config.pl.json`:** Remove the old risk scoring configuration.

*   **Core Logic:**
    *   `[x]` **Create `lib/services/guideline-engine.service.ts`:** Create a new service that reads the `preventive-plan-config.json`, processes user answers against the rules, and outputs a structured list of action IDs (e.g., `{ screenings: ["COLONOSCOPY_AGE_50"], lifestyle: ["DISCUSS_DIET"] }`).
    *   `[x]` **Delete `lib/services/risk-calculator.service.ts`:** Remove the old service entirely.
    *   `[x]` **Update `api/assess/route.ts`:**
        *   Remove the call to `calculateAllRisks`.
        *   Add a call to the new `guidelineEngine.generatePlan()`.
        *   Update the Zod schema (`aiResponseSchema`) to validate the new expected AI output (the `ActionPlan`).

*   **Types:**
    *   `[x]` **[lib/types/index.ts]** Overhaul the type definitions.
        *   Remove `AssessmentResult`, `RiskFactor`, `ModelAssessment`, `CalculatedRiskFactor`, etc.
        *   Create new types: `ActionPlan`, `RecommendedScreening`, `LifestyleGuideline`, `TopicForDoctor`, and the output type from the `guideline-engine.service.ts`.

#### **Phase 3: AI Prompt & Integration Rework**
*(Goal: Re-purpose the AI to be a "Compassionate Explainer" for the deterministically generated plan.)*

*   `[x]` **[lib/ai/prompts/multiRiskAssessment.prompt.ts]** Completely rewrite the prompt.
    *   The new prompt will accept the structured plan from the `guideline-engine` as input.
    *   It will instruct the AI to generate the user-friendly explanatory text (`why it's important`, etc.) for each recommended action.
    *   It will explicitly forbid the AI from calculating risks or creating new recommendations.
    *   Rename the file to `preventivePlanExplainer.prompt.ts`.
*   `[x]` **[lib/ai/composite-ai.service.ts]** Update the service method.
    *   Rename `getRiskAssessmentExplanation` to `getPlanExplanation`.
    *   Update its input parameter to accept the new plan object.
    *   Update it to call the new `preventivePlanExplainer.prompt.ts`.
*   `[x]` **[app/api/assess/route.ts]** Update the call from the old AI method to the new `getPlanExplanation` method.

#### **Phase 4: Frontend Results Page Reconstruction**
*(Goal: Completely replace the "Risk Dashboard" with the new "Personalized Action Plan" UI.)*

*   `[x]` **[app/[locale]/results/page.tsx]** Begin major refactoring.
    *   Remove all UI elements related to the old risk dashboard (Tabs, risk level indicators, `ShieldCheck` icons for summary).
    *   Remove the logic for displaying `modelAssessments`.
*   `[x]` **Create `components/ActionPlanDisplay.tsx`:** Create a new parent component for the results.
*   `[x]` **Create `components/RecommendedScreenings.tsx`:** A component that takes an array of screening recommendations and displays them in clear, individual cards.
*   `[x]` **Create `components/LifestyleGuidelines.tsx`:** A component to display lifestyle advice.
*   `[x]` **Create `components/TopicsForDoctor.tsx`:** A component to list the suggested discussion points.
*   `[x]` **[app/[locale]/results/page.tsx]** Integrate these new components. The page will now fetch the `ActionPlan` and pass the relevant parts to each new component.
*   `[x]` **[lib/hooks/data/useRiskAssessment.ts]** Update the generic type for the `useMutation` to expect the new `ActionPlan` type instead of `AssessmentResult`.

#### **Phase 5: Update Export Functionality**
*(Goal: Ensure the PDF and Email exports are updated to reflect the new "Doctor's Discussion Guide" format.)*

*   `[ ]` **[lib/utils/pdf-generator.ts]** Rewrite the PDF generation logic.
    *   Change the title to "Doctor's Discussion Guide."
    *   Instead of `autoTable` for risk factors, create sections for "Recommended Screenings," "Lifestyle Guidelines," and "Topics for My Doctor."
    *   Include a section that lists the user's provided answers for context.
*   `[ ]` **[lib/services/email.service.ts]** Rewrite the `generateAssessmentHtml` function.
    *   Update the email template to match the new "Doctor's Discussion Guide" format.
*   `[ ]` **[app/api/export/email/route.ts]** Update the Zod validation schema to expect the new `ActionPlan` data structure in the request body.

#### **Phase 6: Testing & Validation**
*(Goal: Update all tests to validate the new functionality and remove obsolete tests.)*

*   `[ ]` **Delete `lib/services/risk-calculator.service.v2.test.ts`**.
*   `[ ]` **Create `lib/services/guideline-engine.service.test.ts`:** Write new unit tests for the rules engine, ensuring it correctly generates action IDs based on sample user inputs.
*   `[ ]` **[e2e/assessment.spec.ts]** Heavily refactor the E2E test.
    *   The test should no longer check for risk tabs or levels.
    *   It should check for the presence of the "Personalized Action Plan" title.
    *   It should check for specific screening recommendations based on the test data provided (e.g., assert that a colonoscopy recommendation appears for a 55-year-old user).
*   `[ ]` **[e2e/features.spec.ts]** Review and update any tests that interact with the results page, particularly the PDF and Email export tests, to validate the new content.
*   `[ ]` **[app/api/assess/route.test.ts]** Update the API route test to mock the new `guideline-engine.service` and validate the new orchestration flow.

#### **Phase 7: Documentation & Final Cleanup**
*(Goal: Ensure all project documentation reflects the final state of the application and remove any dead code.)*

*   `[ ]` **[docs/app_description.md]** Rewrite the technical description to match the new architecture (rules engine + AI explainer).
*   `[ ]` **[docs/description.md]** Rewrite the product vision document.
*   `[ ]` **[.env.example]** Review and remove any environment variables that are no longer needed.
*   `[ ]` **Code Pruning:** Manually search the codebase for any remaining types, components, or utility functions related to "risk," "score," or "assessment" that are no longer used and delete them.

---
This atomic plan provides a clear, step-by-step path to fully implement the revised vision, ensuring all parts of the existing codebase are correctly updated, repurposed, or replaced.
      