The build is failing due to TypeScript errors in `src/app/results/page.tsx`. The errors indicate that parameters in several `.map()` calls have an implicit `any` type. This is because the `assessment` data object, which comes from the `useRiskAssessment` hook, is not correctly typed.

My plan is to fix this by improving type safety at the data-fetching layer. I will modify `src/lib/services/api-client.service.ts` to specify the return type of the `assess` method. By annotating that `apiClient.assessment.assess` returns a `Promise<AssessmentResult>`, TanStack Query's `useMutation` hook will automatically infer this type. This will cause the `assessment` variable in the results page to be correctly typed, which will resolve all the implicit `any` errors in the component's render method.

I will then add a new task to `TASKS.md` to record this fix.

-------------------------------------------------------------------------------
### src/lib/services/api-client.service.ts
```typescript
import axios from "axios";
import type { AssessmentResult } from "@/lib/types";

export const apiClient = {
  questionnaire: {
    getActive: async () => {
      const { data } = await axios.get("/api/questionnaire");
      return data;
    },
  },
  assessment: {
    assess: async (payload: {
      answers: Record<string, string>;
    }): Promise<AssessmentResult> => {
      const { data } = await axios.post<AssessmentResult>(
        "/api/assess",
        payload,
      );
      return data;
    },
  },
  export: {
    email: async (payload: {
      recipientEmail: string;
      assessmentData: AssessmentResult;
    }) => {
      const { data } = await axios.post("/api/export/email", payload);
      return data;
    },
  },
};
```
-------------------------------------------------------------------------------
### TASKS.md
```markdown
# Atomic Plan: Final Production Polish

**Objective:** To address the final remaining issues related to medical logic externalization, user experience, and codebase cleanup to prepare the application for a production launch.

---

### **Epic 1: Externalize Medical Logic (The "Source of Truth")**

**Objective:** To move the hard-coded risk calculation parameters from the TypeScript service file into an external, non-code JSON file for improved safety and maintainability.

*   [x] **Task 1.1: Create the Configuration File**
    *   **Action:** In the `src/lib/` directory, create a new file named `risk-model-config.json`.

*   [x] **Task 1.2: Define and Populate the JSON Structure**
    *   **Action:** Define a clear JSON structure within the new file that holds all numerical weights, thresholds, factor names, and descriptions.
    *   **Code Snippet (Example Structure):**
        ```json
        {
          "factors": {
            "SMOKING_RELATED": {
              "name": "Smoking-Related Risk",
              "questionIds": ["smoking"],
              "thresholds": { "average": 5, "high": 9 }
            }
          },
          "weights": {
            "smoking": {
              "Yes": 10,
              "No": 0
            }
          },
          "positiveFactors": {
            "NON_SMOKER": {
              "name": "Non-Smoker",
              "description": "Not smoking is the single most effective way to reduce your risk.",
              "trigger": { "questionId": "smoking", "answers": ["No"] }
            }
          }
        }
        ```
    *   **Action:** Transfer all hard-coded logic values from `risk-calculator.service.ts` into this new `risk-model-config.json` file.

*   [x] **Task 1.3: Refactor the Risk Calculator Service**
    *   **File:** `src/lib/services/risk-calculator.service.ts`
    *   **Action:** Modify the service to `import` the `risk-model-config.json` file.
    *   **Action:** Refactor the `calculateRisk` function to read its parameters (weights, thresholds) from the imported JSON object instead of using hard-coded values.

*   [x] **Task 1.4: Verify Implementation with Existing Tests**
    *   **Action:** Run the existing unit tests for the risk calculator.
    *   **File:** `src/lib/services/risk-calculator.service.test.ts`
    *   **Expected Result:** All tests should continue to pass, proving that the logic was successfully externalized without changing the calculation outcome.

---

### **Epic 2: Enhance Questionnaire Persistence**

**Objective:** To improve the user experience by persisting questionnaire progress even if the browser tab is accidentally closed.

*   [x] **Task 2.1: Update Zustand Store to Use `localStorage`**
    *   **File:** `src/lib/stores/assessment.store.ts`
    *   **Action:** In the `persist` middleware options, change the storage target from `sessionStorage` to `localStorage`.
    *   **Code Change:**
        ```typescript
        // Change this line:
        storage: createJSONStorage(() => sessionStorage),
        // To this:
        storage: createJSONStorage(() => localStorage),
        ```

*   [x] **Task 2.2: Implement "Resume Session" Logic**
    *   **File:** `src/app/assessment/page.tsx`
    *   **Action:** Add a `useEffect` hook that runs on initial page load.
    *   **Logic:**
        1.  Check if `answers` in the Zustand store are not empty.
        2.  If data exists, use a `Dialog` (like shadcn's `AlertDialog`) to prompt the user: "It looks like you have a session in progress. Would you like to resume or start a new assessment?"
        3.  If "Resume" is clicked, the dialog closes.
        4.  If "Start New" is clicked, call the `reset()` function from the Zustand store.

*   [x] **Task 2.3: Implement Session Cleanup**
    *   **File:** `src/app/results/page.tsx`
    *   **Action:** In the `onClick` handler for the "Start New Assessment" button, ensure the `reset()` function from the Zustand store is called before navigating the user back to the homepage.

*   [x] **Task 2.4: Update E2E Test**
    *   **File:** `e2e/assessment.spec.ts`
    *   **Action:** Add a step in the middle of the questionnaire that reloads the page (`page.reload()`).
    *   **Expected Result:** The test should verify that the user's previous answers are still present in the form fields after the reload.

---

### **Epic 3: Finalize Branding & Cleanup**

**Objective:** To remove the last remnants of the old application and ensure all user-facing assets reflect the new brand.

*   [x] **Task 3.1: Delete Unused Script**
    *   **Action:** Delete the legacy database encryption script.
    *   **Command:** `rm scripts/encrypt-existing-data.cts`

*   [x] **Task 3.2: Update PWA Manifest Files**
    *   **File 1:** `public/manifest.json`
    *   **File 2:** `public/site.webmanifest`
    *   **Action:** In both files, change the `name` and `short_name` fields from "Lexity" to "Health Risk Assessor" (or the final product name).

*   [x] **Task 3.3: Update Project Name**
    *   **File:** `package.json`
    *   **Action:** Change the `"name"` field from `"lexity"` to `"health-risk-assessor"`.

*   [x] **Task 3.4: Final Verification**
