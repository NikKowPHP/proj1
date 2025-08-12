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
    // Step 1: About You (with Imperial units)
    await page.getByText('Select an option').first().click();
    await page.getByRole('option', { name: '40-49' }).click();
    await page.getByText('Select an option').first().click();
    await page.getByRole('option', { name: 'Male' }).click();

    // Switch to Imperial units
    await page.getByRole('tab', { name: 'Imperial (inches / lbs)' }).click();
    await expect(page.getByPlaceholder('e.g., 69')).toBeVisible();

    // Fill height and weight
    await page.getByLabel('Height').fill('70'); // 70 inches
    await page.getByLabel('Weight').fill('180'); // 180 lbs

    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: Lifestyle Habits (with conditional question)
    await expect(page.getByRole("heading", { name: "Lifestyle Habits" })).toBeVisible();
    
    // Select "Former smoker" to show conditional question
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Former smoker" }).click();
    
    // Check conditional question is now visible and answer it
    await expect(page.getByText('How many years has it been since you quit smoking?')).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "1-5 years" }).click();
    
    // Answer alcohol question
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "3-7" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    
    // Step 3: Diet & Exercise
    await expect(page.getByRole("heading", { name: "Diet & Exercise" })).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "1-2 days" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "4-5" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "1-2 times" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 4: Medical History
    await expect(page.getByRole("heading", { name: "Medical History" })).toBeVisible();
    await expect(page.getByText('This information helps provide a more accurate assessment.')).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Yes" }).click();
    
    // Mock the API response for the assessment
    await page.route("**/api/assess", async (route) => {
      const json = {
        riskFactors: [
          { factor: "Genetic Predisposition", riskLevel: "High", explanation: "Mock explanation about genetics." },
          { factor: "Body Composition Risk (BMI)", riskLevel: "Moderate", explanation: "Mock explanation about BMI." },
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

    // Check for mocked content
    await expect(page.getByText("Genetic Predisposition")).toBeVisible();
    await expect(page.getByText("Body Composition Risk (BMI)")).toBeVisible();
    await expect(page.getByText("Consult a healthcare professional about these results.")).toBeVisible();
  });
});