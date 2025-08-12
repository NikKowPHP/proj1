import { test, expect } from "@playwright/test";

test.describe("Core Assessment Flow", () => {
  test("should allow a user to complete the assessment and view results", async ({
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
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "40-49" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Male" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: Lifestyle Habits
    await expect(page.getByRole("heading", { name: "Lifestyle Habits" })).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "Yes" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "3-7" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    
    // Step 3: Diet & Exercise
    await expect(page.getByRole("heading", { name: "Diet & Exercise" })).toBeVisible();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "1-2 days" }).click();
    await page.getByText("Select an option").first().click();
    await page.getByRole("option", { name: "4-5" }).click();
    
    // Mock the API response for the assessment
    await page.route("**/api/assess", async (route) => {
      const json = {
        riskFactors: [
          { factor: "Smoking Habits", riskLevel: "High", explanation: "Mock explanation about smoking." },
        ],
        positiveFactors: [
          { factor: "Healthy Diet", explanation: "Mock explanation about diet." },
        ],
        recommendations: ["Consult a healthcare professional."],
      };
      await route.fulfill({ json });
    });

    // 4. Submit and navigate to results
    await page.getByRole("button", { name: "View Results" }).click();
    
    // 5. Verify results page
    await expect(page).toHaveURL("/results");
    await expect(page.getByRole("heading", { name: "Your Assessment Results" })).toBeVisible();

    // Check for mocked content
    await expect(page.getByText("Smoking Habits")).toBeVisible();
    await expect(page.getByText("Healthy Diet")).toBeVisible();
    await expect(page.getByText("Consult a healthcare professional.")).toBeVisible();
  });
});