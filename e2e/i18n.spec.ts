import { test, expect, Page } from "@playwright/test";

test.describe("Phase 3: Internationalization (i18n)", () => {
  const completeAssessmentInPolish = async (page: Page) => {
    await page.goto("/pl/assessment");

    // Step 1: About you
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "18-29" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Mężczyzna" }).click();
    await page.getByLabel("Wzrost").fill("180");
    await page.getByLabel("Waga").fill("80");
    await page.getByRole("button", { name: "Dalej" }).click();

    // Step 2: Lifestyle
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Nigdy nie paliłem/am" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Wcale" }).click();
    await page.getByRole("button", { name: "Dalej" }).click();

    // Step 3: Diet & Exercise
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "0 dni" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "0-1" }).click();
    await page.getByRole("combobox").nth(2).click();
    await page.getByRole("option", { name: "Nigdy lub rzadko" }).click();
    await page.getByRole("button", { name: "Dalej" }).click();

    // Step 4: Health Conditions
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Nie" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Nie" }).click();
    await page.getByRole("button", { name: "Dalej" }).click();

    // Step 5: Environmental
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Nie" }).click();
    await page.getByRole("button", { name: "Dalej" }).click();

    // Step 6: Family History
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Nie" }).click();

    // Submit
    await page.getByRole("button", { name: "Zobacz wyniki" }).click();
  };

  test("should download a PDF with a translated filename in Polish", async ({
    page,
  }) => {
    // Mock API response before navigation
    await page.route("**/api/assess", async (route) => {
      await route.fulfill({
        json: {
          overallSummary: "To jest testowe podsumowanie.",
          modelAssessments: [],
          positiveFactors: [],
          recommendations: [],
        },
      });
    });

    // Complete assessment
    await completeAssessmentInPolish(page);

    // Verify on results page
    await expect(
      page.getByRole("heading", { name: "Twoje Wyniki Oceny" }),
    ).toBeVisible();

    // Test PDF Download filename
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Pobierz jako PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /Wyniki_Oceny_Zdrowia_.*\.pdf/,
    );
  });

  test("should display translated content on static pages (Privacy Policy)", async ({
    page,
  }) => {
    await page.goto("/pl/privacy");

    // Check for translated title
    await expect(
      page.getByRole("heading", { name: "Polityka Prywatności" }),
    ).toBeVisible();

    // Check for a translated content string
    await expect(
      page.getByText(
        "Podstawową zasadą tej Usługi jest anonimowość użytkownika.",
      ),
    ).toBeVisible();
  });
});
      