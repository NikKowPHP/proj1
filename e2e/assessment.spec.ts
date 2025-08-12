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
    await page.getByRole('option', { name: '40-49' }).click();
    await page.getByText('Select an option').first().click();
    await page.getByRole('option', { name: 'Male' }).click();
    await page.getByLabel('Height').fill('178'); // cm
    await page.getByLabel('Weight').fill('85'); // kg
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: Lifestyle Habits
    await expect(page.getByRole("heading", { name: "Lifestyle Habits" })).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Current smoker" }).click();
    // Conditional question for 'Current smoker'
    await expect(page.getByText('For how many years have you been smoking?')).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "11-20 years" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "3-7" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    
    // Step 3: Diet & Exercise
    await expect(page.getByRole("heading", { name: "Diet & Exercise" })).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "1-2 days" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "2-3" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "1-2 times" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 4: Environmental & Occupational History
    await expect(page.getByRole("heading", { name: "Environmental & Occupational History" })).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Yes" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 5: Family History
    await expect(page.getByRole("heading", { name: "Family History" })).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "No" }).click();
    
    // Mock the API response for the assessment
    await page.route("**/api/assess", async (route) => {
      const json = {
        modelAssessments: [
          {
            modelName: "General Cancer Risk",
            riskFactors: [
              { factor: "Smoking-Related Risk", riskLevel: "High", explanation: "Mock explanation for general smoking risk." }
            ]
          },
          {
            modelName: "Lung Cancer Risk",
            riskFactors: [
              { factor: "Smoking Impact", riskLevel: "High", explanation: "Mock explanation for lung cancer smoking risk." },
              { factor: "Environmental & Occupational Risks", riskLevel: "High", explanation: "Mock explanation for asbestos exposure." }
            ]
          }
        ],
        positiveFactors: [],
        recommendations: ["Consult a healthcare professional about these results."],
      };
      await route.fulfill({ json });
    });

    // 4. Submit and navigate to results
    await page.getByRole("button", { name: "View Results" }).click();
    
    // 5. Verify results page
    await expect(page).toHaveURL("/results");
    await expect(page.getByRole("heading", { name: "Your Assessment Results" })).toBeVisible();

    // Check for tabbed interface
    await expect(page.getByRole('tab', { name: 'General Cancer Risk' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Lung Cancer Risk' })).toBeVisible();

    // Check content of the first tab (should be visible by default)
    await expect(page.getByText("Smoking-Related Risk")).toBeVisible();
    await expect(page.getByText("Mock explanation for general smoking risk.")).toBeVisible();

    // Click the second tab and check its content
    await page.getByRole('tab', { name: 'Lung Cancer Risk' }).click();
    await expect(page.getByText("Smoking Impact")).toBeVisible();
    await expect(page.getByText("Mock explanation for lung cancer smoking risk.")).toBeVisible();
    await expect(page.getByText("Environmental & Occupational Risks")).toBeVisible();
    await expect(page.getByText("Mock explanation for asbestos exposure.")).toBeVisible();

    // Check for global recommendations
    await expect(page.getByText("Consult a healthcare professional about these results.")).toBeVisible();
  });
});