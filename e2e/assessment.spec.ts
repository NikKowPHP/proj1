import { test, expect } from "@playwright/test";

test.describe("Core Assessment Flow v2", () => {
  test("should allow a user to complete the full v2 assessment and view results", async ({
    page,
  }) => {
    // 1. Visit the welcome page
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Anonymous Health Risk Assessment" }),
    ).toBeVisible();

    // 2. Start the assessment
    await page.getByRole("button", { name: "Start My Anonymous Assessment" }).click();
    await expect(page).toHaveURL("/assessment");

    // 3. Complete the multi-step questionnaire
    // Step 1: About You
    await page.getByText('Select an option').first().click();
    await page.getByRole('option', { name: '50-59' }).click();
    await page.getByText('Select an option').first().click();
    await page.getByRole('option', { name: 'Male' }).click();
    await page.getByLabel('Height').fill('178'); // cm
    await page.getByLabel('Weight').fill('95'); // kg (BMI ~30, Obese)
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: Lifestyle Habits
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Current smoker" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "More than 20 years" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "8-14" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    
    // Step 3: Diet & Exercise
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "0 days" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "0-1" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "3-4 times" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 4: Health Conditions
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Yes" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Yes" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 5: Environmental & Occupational History
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "No" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 6: Family History
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "I don't know" }).click();
    
    // Mock the API response
    await page.route("**/api/assess", async (route) => {
      const json = {
        overallSummary: "This is a mock overall summary highlighting key risks.",
        modelAssessments: [
          { modelName: "General Cancer Risk", riskFactors: [{ factor: "Genetic Predisposition", riskLevel: "Moderate", explanation: "Mock explanation for genetics." }] },
          { modelName: "Lung Cancer Risk", riskFactors: [{ factor: "Smoking Impact", riskLevel: "High", explanation: "Mock explanation for smoking." }] },
          { modelName: "Cardiovascular Risk", riskFactors: [{ factor: "Key Health Indicators", riskLevel: "High", explanation: "Mock explanation for cardio." }] }
        ],
        positiveFactors: [],
        recommendations: ["Consult a healthcare professional."],
      };
      await route.fulfill({ json });
    });

    // 4. Submit and navigate to results
    await page.getByRole("button", { name: "View Results" }).click();
    
    // 5. Verify results page
    await expect(page).toHaveURL("/results");
    await expect(page.getByRole("heading", { name: "Your Assessment Results" })).toBeVisible();

    // Check for overall summary
    await expect(page.getByRole("heading", { name: "Overall Summary" })).toBeVisible();
    await expect(page.getByText("This is a mock overall summary highlighting key risks.")).toBeVisible();

    // Check for tabs
    await expect(page.getByRole('tab', { name: 'General Cancer Risk' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Lung Cancer Risk' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Cardiovascular Risk' })).toBeVisible();

    // Check content of the first tab
    await expect(page.getByText("Genetic Predisposition")).toBeVisible();
    
    // Click and check second tab
    await page.getByRole('tab', { name: 'Lung Cancer Risk' }).click();
    await expect(page.getByText("Smoking Impact")).toBeVisible();

    // Click and check third tab
    await page.getByRole('tab', { name: 'Cardiovascular Risk' }).click();
    await expect(page.getByText("Key Health Indicators")).toBeVisible();
  });
});