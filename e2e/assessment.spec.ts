import { test, expect } from "@playwright/test";

test("should redirect from / to /en/", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/en");
  await expect(page.getByRole("heading", { name: "ONKONO" })).toBeVisible();
});

const translations = {
  en: {
    homeTitle: "ONKONO",
    startCta: "Start My Assessment",
    resumeDialogTitle: "Resume Session?",
    step1: {
      title: "Building Your Profile",
      age: "50-59",
      sex: "Male",
    },
    step2: {
      title: "Lifestyle Habits",
      smoking: "Current smoker",
      duration: "More than 20 years",
      alcohol: "8-14",
    },
    step3: {
      symptom: "Unexplained weight loss",
    },
    step4: {
      pressure: "Yes",
    },
    results: {
      title: "Your Preventive Health Plan",
      submit: "View Results",
      screeningTitle: "Colorectal Cancer Screening",
      topicTitle: "Discuss Smoking Cessation",
      newAssessment: "Build New Plan",
    },
  },
  pl: {
    homeTitle: "ONKONO",
    startCta: "Rozpocznij Moją Ocenę",
    resumeDialogTitle: "Wznowić sesję?",
    step1: {
      title: "Tworzenie Twojego Profilu",
      age: "50-59",
      sex: "Mężczyzna",
    },
    step2: {
      title: "Nawyki Stylu Życia",
      smoking: "Obecny palacz",
      duration: "Ponad 20 lat",
      alcohol: "8-14",
    },
     step3: {
      symptom: "Niewyjaśniona utrata wagi",
    },
    step4: {
      pressure: "Tak",
    },
    results: {
      title: "Twój Profilaktyczny Plan Zdrowia",
      submit: "Zobacz wyniki",
      screeningTitle: "Badanie Przesiewowe w kierunku Raka Jelita Grubego", // Mocked title
      topicTitle: "Omów Zaprzestanie Palenia", // Mocked title
      newAssessment: "Zbuduj Nowy Plan",
    },
  },
};

const locales = ["en", "pl"] as const;

for (const locale of locales) {
  test.describe(`Core Assessment Flow (${locale})`, () => {
    test("should allow a user to complete the assessment and view the action plan", async ({
      page,
    }) => {
      const t = translations[locale];

      // 1. Visit the welcome page
      await page.goto(`/${locale}`);
      await expect(
        page.getByRole("heading", { name: t.homeTitle }),
      ).toBeVisible();

      // 2. Start the assessment
      await page.getByRole("button", { name: t.startCta }).click();
      await expect(page).toHaveURL(`/${locale}/assessment`);
      await expect(page.getByRole("heading", { name: "ONKONO" })).toBeVisible();

      // 3. Complete the multi-step questionnaire
      // Step 1
      await expect(page.getByRole("heading", { name: t.step1.title })).toBeVisible();
      await page.locator('label:has-text("Privacy Policy")').click(); // Consent
      await page.getByRole("combobox").nth(0).click(); // Intent
      await page.getByRole("option").first().click();
      await page.getByRole("combobox").nth(1).click(); // Source
      await page.getByRole("option").first().click();
      await page.getByRole("combobox").nth(2).click(); // Language
      await page.getByRole("option").first().click();
      await page.getByRole("combobox").nth(3).click(); // Age
      await page.getByRole("option", { name: t.step1.age }).click();
      await page.getByRole("combobox").nth(4).click(); // Sex
      await page.getByRole("option", { name: t.step1.sex }).click();
      await page.getByLabel("Height").fill("178");
      await page.getByLabel("Weight").fill("95");
      await page.getByRole("button", { name: "Next" }).click();

      // Step 2
      await expect(page.getByRole("heading", { name: t.step2.title })).toBeVisible();
      await page.getByRole("combobox").nth(0).click();
      await page.getByRole("option", { name: t.step2.smoking }).click();
      await page.getByRole("combobox").nth(1).click(); // Conditional question
      await page.getByRole("option", { name: t.step2.duration }).click();
      await page.getByRole("combobox").nth(2).click();
      await page.getByRole("option", { name: t.step2.alcohol }).click();
      await page.getByRole("button", { name: "Next" }).click();
      
      // Step 3 (Symptoms)
      await page.getByLabel(t.step3.symptom).click();
      await page.getByRole("button", { name: "Next" }).click();

      // Step 4 (Diet)
      const selectsStep4 = await page.getByRole("combobox").all();
      for (const select of selectsStep4) {
        await select.click();
        await page.getByRole("option").first().click();
      }
      await page.getByRole("button", { name: "Next" }).click();
      
      // Step 5 (Health Conditions)
      await page.getByRole("combobox").nth(0).click();
      await page.getByRole("option", { name: t.step4.pressure }).click();
      await page.getByRole("combobox").nth(1).click();
      await page.getByRole("option").first().click();
      await page.getByRole("button", { name: "Next" }).click();

      // Step 6 (Advanced) - Just click next
       await page.getByRole("button", { name: "Next" }).click();


      // Step 7 & 8
      for (let i = 0; i < 2; i++) {
        const selects = await page.getByRole("combobox").all();
        for (const select of selects) {
          await select.click();
          await page.getByRole("option").first().click();
        }
        if (i < 1) await page.getByRole("button", { name: "Next" }).click();
      }

      // Mock the API response to return a valid ActionPlan
      await page.route("**/api/assess", async (route) => {
        const json = {
          overallSummary: "This is a mock summary.",
          recommendedScreenings: [
            {
              id: "COLORECTAL_CANCER_SCREENING",
              title: t.results.screeningTitle,
              description: "A screening to detect early signs of colorectal cancer.",
              why: "Recommended based on your age group.",
            },
          ],
          lifestyleGuidelines: [],
          topicsForDoctor: [
            {
              id: "DISCUSS_SMOKING_CESSATION",
              title: t.results.topicTitle,
              why: "Recommended because you are a current smoker.",
            },
          ],
        };
        await route.fulfill({ json });
      });

      // 4. Submit and navigate to results
      await page.getByRole("button", { name: t.results.submit }).click();

      // 5. Verify results page
      await expect(page).toHaveURL(`/${locale}/results`);
      await expect(page.getByRole("heading", { name: t.results.title })).toBeVisible();

      // Check for specific plan items
      await expect(page.getByText(t.results.screeningTitle)).toBeVisible();
      await expect(page.getByText(t.results.topicTitle)).toBeVisible();

      // 6. Test starting a new assessment clears state
      await page.getByRole("button", { name: t.results.newAssessment }).click();

      await expect(page).toHaveURL(`/${locale}`);
      await expect(page.getByRole("heading", { name: t.homeTitle })).toBeVisible();

      await page.getByRole("button", { name: t.startCta }).click();
      await expect(page).toHaveURL(`/${locale}/assessment`);

      // Verify "Resume Session" dialog does NOT appear
      await expect(
        page.getByRole("heading", { name: t.resumeDialogTitle }),
      ).not.toBeVisible();

      // Verify we are on step 1
      await expect(page.getByRole("heading", { name: t.step1.title })).toBeVisible();
    });

     test("should show conditional advanced section for Symptom Details", async ({ page }) => {
        const t = translations[locale];
        await page.goto(`/${locale}/assessment`);

        // Navigate through the form to the symptoms step
        for (let i = 0; i < 2; i++) {
          await page.locator('label:has-text("Privacy Policy")').click(); // Consent
          const selects = await page.getByRole("combobox").all();
          for (const select of selects) {
            await select.click();
            await page.getByRole("option").first().click();
          }
          await page.getByLabel("Height").fill("178");
          await page.getByLabel("Weight").fill("95");
          await page.getByRole("button", { name: "Next" }).click();
        }
        
        // On symptoms step, select a symptom
        await page.getByLabel(t.step3.symptom).click();
        await page.getByRole("button", { name: "Next" }).click();

        // Navigate to the advanced section
         for (let i = 0; i < 3; i++) {
            const selects = await page.getByRole("combobox").all();
            for (const select of selects) {
                await select.click();
                await page.getByRole("option").first().click();
            }
            await page.getByRole("button", { name: "Next" }).click();
         }
        
        // Now on the Advanced step
        await expect(page.getByRole("heading", { name: "Advanced" })).toBeVisible();

        // The "Symptom Details" accordion should be visible
        const symptomDetailsTrigger = page.getByRole("button", { name: "Symptom Details" });
        await expect(symptomDetailsTrigger).toBeVisible();

        // Open it and check for content
        await symptomDetailsTrigger.click();
        await expect(page.getByText(t.step3.symptom)).toBeVisible();
        await expect(page.getByText("When did it start?")).toBeVisible();
    });
  });
}
