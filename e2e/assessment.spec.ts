import { test, expect } from "@playwright/test";

test("should redirect from / to /en/", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/en");
  await expect(
    page.getByRole("heading", { name: "Anonymous Health Risk Assessment" }),
  ).toBeVisible();
});

const translations = {
  en: {
    assessmentTitle: "Anonymous Health Risk Assessment",
    startCta: "Start My Anonymous Assessment",
    step1: {
      age: "50-59",
      sex: "Male",
    },
    step2: {
      smoking: "Current smoker",
      duration: "More than 20 years",
      alcohol: "8-14",
    },
    step3: {
      activity: "0 days",
      fruits: "0-1",
      meat: "3-4 times",
    },
    step4: {
      pressure: "Yes",
      diabetes: "Yes",
    },
    step5: {
      asbestos: "No",
    },
    step6: {
      familyHistory: "I don't know",
    },
    results: {
      title: "Your Assessment Results",
      submit: "View Results",
      tab1: "General Cancer Risk",
      tab2: "Lung Cancer Risk",
      tab3: "Cardiovascular Risk",
    },
    option: (text: string) => page.getByRole("option", { name: text }),
  },
  pl: {
    assessmentTitle: "Anonimowa Ocena Ryzyka Zdrowotnego",
    startCta: "Rozpocznij Moją Anonimową Ocenę",
    step1: {
      age: "50-59",
      sex: "Mężczyzna",
    },
    step2: {
      smoking: "Obecny palacz",
      duration: "Ponad 20 lat",
      alcohol: "8-14",
    },
    step3: {
      activity: "0 dni",
      fruits: "0-1",
      meat: "3-4 razy",
    },
    step4: {
      pressure: "Tak",
      diabetes: "Tak",
    },
    step5: {
      asbestos: "Nie",
    },
    step6: {
      familyHistory: "Nie wiem",
    },
    results: {
      title: "Twoje Wyniki Oceny",
      submit: "Zobacz wyniki",
      tab1: "Ogólne Ryzyko Nowotworowe",
      tab2: "Ryzyko Raka Płuc",
      tab3: "Ryzyko Sercowo-Naczyniowe",
    },
    option: (text: string) => page.getByRole("option", { name: text }),
  },
};

const locales = ["en", "pl"] as const;

for (const locale of locales) {
  test.describe(`Core Assessment Flow v2 (${locale})`, () => {
    test("should allow a user to complete the full v2 assessment and view results", async ({
      page,
    }) => {
      const t = translations[locale];

      // 1. Visit the welcome page
      await page.goto(`/${locale}`);
      await expect(
        page.getByRole("heading", { name: t.assessmentTitle }),
      ).toBeVisible();

      // 2. Start the assessment
      await page.getByRole("button", { name: t.startCta }).click();
      await expect(page).toHaveURL(`/${locale}/assessment`);

      // 3. Complete the multi-step questionnaire
      // Step 1: About You
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step1.age }).click();
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step1.sex }).click();
      await page.getByLabel("Height").fill("178"); // cm
      await page.getByLabel("Weight").fill("95"); // kg (BMI ~30, Obese)
      await page.getByRole("button", { name: "Next" }).click();

      // Step 2: Lifestyle Habits
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step2.smoking }).click();
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step2.duration }).click();
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step2.alcohol }).click();
      await page.getByRole("button", { name: "Next" }).click();

      // Step 3: Diet & Exercise
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step3.activity }).click();
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step3.fruits }).click();
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step3.meat }).click();
      await page.getByRole("button", { name: "Next" }).click();

      // Step 4: Health Conditions
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step4.pressure }).click();
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step4.diabetes }).click();
      await page.getByRole("button", { name: "Next" }).click();

      // Step 5: Environmental & Occupational History
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step5.asbestos }).click();
      await page.getByRole("button", { name: "Next" }).click();

      // Step 6: Family History
      await page.getByText("Select an option").first().click();
      await page.getByRole("option", { name: t.step6.familyHistory }).click();

      // Mock the API response
      await page.route("**/api/assess", async (route) => {
        const json = {
          overallSummary:
            "This is a mock overall summary highlighting key risks.",
          modelAssessments: [
            {
              modelName: t.results.tab1,
              riskFactors: [
                {
                  factor: "Genetic Predisposition",
                  riskLevel: "Moderate",
                  explanation: "Mock explanation for genetics.",
                },
              ],
            },
            {
              modelName: t.results.tab2,
              riskFactors: [
                {
                  factor: "Smoking Impact",
                  riskLevel: "High",
                  explanation: "Mock explanation for smoking.",
                },
              ],
            },
            {
              modelName: t.results.tab3,
              riskFactors: [
                {
                  factor: "Key Health Indicators",
                  riskLevel: "High",
                  explanation: "Mock explanation for cardio.",
                },
              ],
            },
          ],
          positiveFactors: [],
          recommendations: ["Consult a healthcare professional."],
        };
        await route.fulfill({ json });
      });

      // 4. Submit and navigate to results
      await page.getByRole("button", { name: t.results.submit }).click();

      // 5. Verify results page
      await expect(page).toHaveURL(`/${locale}/results`);
      await expect(
        page.getByRole("heading", { name: t.results.title }),
      ).toBeVisible();

      // Check for overall summary
      await expect(
        page.getByRole("heading", { name: /summary/i }),
      ).toBeVisible();
      await expect(
        page.getByText("This is a mock overall summary highlighting key risks."),
      ).toBeVisible();

      // Check for tabs
      await expect(page.getByRole("tab", { name: t.results.tab1 })).toBeVisible();
      await expect(page.getByRole("tab", { name: t.results.tab2 })).toBeVisible();
      await expect(page.getByRole("tab", { name: t.results.tab3 })).toBeVisible();

      // Check content of the first tab
      await expect(page.getByText("Genetic Predisposition")).toBeVisible();

      // Click and check second tab
      await page.getByRole("tab", { name: t.results.tab2 }).click();
      await expect(page.getByText("Smoking Impact")).toBeVisible();

      // Click and check third tab
      await page.getByRole("tab", { name: t.results.tab3 }).click();
      await expect(page.getByText("Key Health Indicators")).toBeVisible();
    });
  });
}
