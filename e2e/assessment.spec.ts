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


test.describe("Advanced Module Flows (en)", () => {

    const navigateToAdvancedStep = async (page) => {
        await page.goto("/en/assessment");
        await page.locator('label:has-text("Privacy Policy")').click();
        await page.getByLabel("What’s your goal").click();
        await page.getByRole("option", { name: "Prevention" }).click();
        await page.getByLabel("Date of birth").fill("1980-01-01");
        await page.getByLabel("Sex at birth").click();
        await page.getByRole("option", { name: "Female" }).click();
        await page.getByLabel("First-degree relative with cancer").click();
        await page.getByRole("option", { name: "Yes" }).click();
        await page.getByLabel("Any chronic illnesses?").click();
        await page.getByRole("option", { name: "Yes" }).click();
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByRole('heading', { name: 'Advanced Details' })).toBeVisible();
    };

    test("should auto-select exposures based on Job Title (JEM)", async ({ page }) => {
        await navigateToAdvancedStep(page);
        
        await page.route("**/api/jobs/suggest-exposures?jobTitle=welder", async (route) => {
            await route.fulfill({ json: ["welding_fumes"] });
        });

        await page.getByRole('button', { name: 'Occupational Hazards' }).click();
        await page.getByRole('button', { name: 'Add Job' }).click();
        
        await page.getByLabel('Job Title').click();
        await page.getByRole('option', { name: 'Welder' }).click();

        const weldingFumesChip = page.getByRole('button', { name: 'Welding fumes' });
        await expect(weldingFumesChip).toHaveAttribute('data-selected', 'true');
    });

    test("should handle conditional logic and validation in Genetics module", async ({ page }) => {
        await navigateToAdvancedStep(page);
        
        await page.getByRole('button', { name: 'Genetics (Optional)' }).click();
        
        // Initially, dependent fields should be hidden
        await expect(page.getByLabel('What type of genetic test')).not.toBeVisible();
        await expect(page.getByLabel('If yes: which genes?')).not.toBeVisible();
        
        // Show conditional fields
        await page.getByLabel('Have you ever had genetic').click();
        await page.getByRole('option', { name: 'Yes' }).click();
        await expect(page.getByLabel('What type of genetic test')).toBeVisible();

        // Test year validation
        const futureYear = (new Date().getFullYear() + 1).toString();
        await page.getByLabel('In what year was the test performed?').fill(futureYear);
        await expect(page.getByText('Year cannot be in the future.')).toBeVisible();
        await page.getByLabel('In what year was the test performed?').fill("2022");
        await expect(page.getByText('Year cannot be in the future.')).not.toBeVisible();

        // Test HGVS validation
        await page.getByLabel('Did the report mention').click();
        await page.getByRole('option', { name: 'Yes' }).click();
        await page.getByLabel('Variant(s) (HGVS, optional)').fill("invalid-variant");
        await expect(page.getByText('Please enter a valid HGVS format')).toBeVisible();
        await page.getByLabel('Variant(s) (HGVS, optional)').fill("c.123A>G");
        await expect(page.getByText('Please enter a valid HGVS format')).not.toBeVisible();

        // Check gene selection
        await page.getByLabel('BRCA1').check();
        await page.getByLabel('MLH1').check();
        await expect(page.getByLabel('BRCA1')).toBeChecked();
        await expect(page.getByLabel('MLH1')).toBeChecked();
    });

    test("should correctly add and manage multiple conditions in Personal Medical History", async ({ page }) => {
        await navigateToAdvancedStep(page);
        
        await page.getByRole('button', { name: 'Personal Medical History' }).click();
        
        // Initially no detail cards are visible
        await expect(page.getByRole('heading', { name: 'Diabetes' })).not.toBeVisible();

        // Select two conditions
        await page.getByLabel('Diabetes').check();
        await page.getByLabel('Hypertension').check();
        
        // Verify detail cards appear
        const diabetesCard = page.locator('div:near(:text("Diabetes"))').locator('..').locator('..');
        const hypertensionCard = page.locator('div:near(:text("Hypertension"))').locator('..').locator('..');
        
        await expect(diabetesCard).toBeVisible();
        await expect(hypertensionCard).toBeVisible();

        // Interact with details of one card
        await diabetesCard.getByLabel('Year of Diagnosis').fill('2010');
        await diabetesCard.getByLabel('Current Status').click();
        await page.getByRole('option', { name: 'Active' }).click();
        
        // Verify state is maintained
        await expect(diabetesCard.getByLabel('Year of Diagnosis')).toHaveValue('2010');
        await expect(diabetesCard.getByText('Active')).toBeVisible();
        
        // Uncheck one condition
        await page.getByLabel('Hypertension').uncheck();
        await expect(hypertensionCard).not.toBeVisible();
        await expect(diabetesCard).toBeVisible(); // The other should remain
    });

    test('should fill out the Sexual Health module', async ({ page }) => {
        await navigateToAdvancedStep(page);

        await page.getByRole('button', { name: 'Sexual Health' }).click();

        await page.getByLabel('Currently sexually active?').click();
        await page.getByRole('option', { name: 'Yes' }).click();

        await page.getByLabel('Male').check();
        await page.getByLabel('Lifetime sexual partners').click();
        await page.getByRole('option', { name: '2-4' }).click();

        await page.getByLabel('Anal intercourse?').click();
        await page.getByRole('option', { name: 'Yes' }).click();
        await expect(page.getByText('Yes')).toBeVisible();

        await page.getByLabel('Oral sex?').click();
        await page.getByRole('option', { name: 'No' }).click();
        await expect(page.getByText('No')).toBeVisible();
    });

    test('should handle conditional logic in the Environmental Exposures module', async ({ page }) => {
        await navigateToAdvancedStep(page);

        await page.getByRole('button', { name: 'Environmental Exposures' }).click();

        await page.getByLabel('Primary drinking water source').click();
        await page.getByRole('option', { name: 'Private well' }).click();
        
        await expect(page.getByLabel('Private well tested (12m)?')).toBeVisible();
        await page.getByLabel('Private well tested (12m)?').click();
        await page.getByRole('option', { name: 'Yes' }).click();

        await expect(page.getByLabel('Arsenic')).toBeVisible();
        await page.getByLabel('Arsenic').check();
        await expect(page.getByLabel('Arsenic')).toBeChecked();
    });

    test('should correctly add and manage multiple entries in Labs & Imaging', async ({ page }) => {
        await navigateToAdvancedStep(page);

        await page.getByRole('button', { name: 'Labs & Imaging' }).click();
        const addBtn = page.getByRole('button', { name: 'Add Lab or Imaging Study' });

        await addBtn.click();
        await addBtn.click();

        const studyInputs = await page.getByPlaceholder('e.g., CBC, Chest X-ray, CA-125').all();
        expect(studyInputs.length).toBe(2);

        await studyInputs[0].fill('First Study');
        await studyInputs[1].fill('Second Study');

        await expect(page.getByDisplayValue('First Study')).toBeVisible();
        await expect(page.getByDisplayValue('Second Study')).toBeVisible();

        // Remove the first entry
        await page.getByLabel('Remove item').first().click();
        
        const remainingStudyInputs = await page.getByPlaceholder('e.g., CBC, Chest X-ray, CA-125').all();
        expect(remainingStudyInputs.length).toBe(1);
        await expect(page.getByDisplayValue('Second Study')).toBeVisible();
        await expect(page.getByDisplayValue('First Study')).not.toBeVisible();
    });

    test('should correctly select a Functional Status', async ({ page }) => {
        await navigateToAdvancedStep(page);

        await page.getByRole('button', { name: 'Functional Status' }).click();
        await page.getByLabel('ECOG Performance Status').click();

        // Using a partial text match for the long option label
        const optionToSelect = page.getByText('1 - Restricted in physically strenuous activity but ambulatory');
        await optionToSelect.click();
        
        await expect(page.getByText('1 - Restricted in physically strenuous activity but ambulatory')).toBeVisible();
    });

});
