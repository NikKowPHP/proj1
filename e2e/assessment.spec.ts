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
    step1Title: "Core Questions",
    sex: "Male",
    smoking: "Current",
    familyCancer: "Yes",
    symptom: "Weight loss",
    advancedTitle: "Advanced Details",
    geneticsTitle: "Genetics (Optional)",
    submit: "View Results",
    resultsTitle: "Your Preventive Health Plan",
  },
  pl: {
    homeTitle: "ONKONO",
    startCta: "Rozpocznij Moją Ocenę",
    step1Title: "Podstawowe Pytania",
    sex: "Mężczyzna",
    smoking: "Obecnie",
    familyCancer: "Tak",
    symptom: "Utrata wagi",
    advancedTitle: "Szczegóły Zaawansowane",
    geneticsTitle: "Genetyka (Opcjonalne)",
    submit: "Zobacz wyniki",
    resultsTitle: "Twój Profilaktyczny Plan Zdrowia",
  },
};

const locales = ["en", "pl"] as const;

for (const locale of locales) {
  test.describe(`Core Assessment Flow (${locale})`, () => {
    test("should allow a user to complete the assessment and view the action plan", async ({
      page,
    }) => {
      const t = translations[locale];

      // 1. Visit the welcome page and start assessment
      await page.goto(`/${locale}`);
      await page.getByRole("button", { name: t.startCta }).click();
      await expect(page).toHaveURL(`/${locale}/assessment`);

      // 2. Complete Core Questions
      await expect(page.getByRole("heading", { name: t.step1Title })).toBeVisible();
      // Consent
      await page.locator('label:has-text("Privacy Policy")').click();
      
      // Fill out fields
      await page.getByLabel(t.startCta.includes("Ocenę") ? "Jaki jest cel" : "What’s your goal").click();
      await page.getByRole("option", { name: t.startCta.includes("Ocenę") ? "Profilaktyka" : "Prevention" }).click();
      
      await page.getByLabel("Date of birth").fill("1980-01-01");
      
      await page.getByLabel(t.startCta.includes("Ocenę") ? "Płeć przy urodzeniu" : "Sex at birth").click();
      await page.getByRole("option", { name: t.sex }).click();

      await page.getByLabel("Height").fill("180");
      await page.getByLabel("Weight").fill("85");
      
      await page.getByLabel(t.startCta.includes("Ocenę") ? "Status palenia" : "Smoking status").click();
      await page.getByRole("option", { name: t.smoking }).click();

      await page.getByLabel(t.startCta.includes("Ocenę") ? "Spożycie alkoholu" : "Alcohol consumption").click();
      await page.getByRole("option").nth(1).click(); // Moderate
      
      await page.getByLabel(t.symptom).click(); // Select a symptom

      await page.getByLabel(t.startCta.includes("Ocenę") ? "Czy bliscy chorowali na raka" : "First-degree relative with cancer").click();
      await page.getByRole("option", { name: t.familyCancer }).click();
      
      await page.getByRole("button", { name: "Next" }).click();

      // 3. Complete Advanced Step (conditionally)
      await expect(page.getByRole("heading", { name: t.advancedTitle })).toBeVisible();
      
      // Verify conditional 'Family History' section is visible
      const familyHistoryTrigger = page.getByRole("button", { name: /Family Cancer History/ });
      await expect(familyHistoryTrigger).toBeVisible();
      await familyHistoryTrigger.click();
      await page.getByRole("button", { name: "Add Relative" }).click();
      await page.getByLabel("Relation").click();
      await page.getByRole("option", { name: "Parent" }).click();
      
      // Check for genetics section (should be visible by default)
      const geneticsTrigger = page.getByRole("button", { name: t.geneticsTitle });
      await expect(geneticsTrigger).toBeVisible();

      // 4. Submit and navigate to results
      // Mock API response
      await page.route("**/api/assess", async (route) => {
        const json = {
          overallSummary: "This is a mock summary.",
          recommendedScreenings: [],
          lifestyleGuidelines: [],
          topicsForDoctor: [],
        };
        await route.fulfill({ json });
      });
      await page.getByRole("button", { name: t.submit }).click();

      // 5. Verify results page
      await expect(page).toHaveURL(`/${locale}/results`);
      await expect(page.getByRole("heading", { name: t.resultsTitle })).toBeVisible();
    });
  });
}
      