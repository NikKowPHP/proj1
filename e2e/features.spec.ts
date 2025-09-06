import { test, expect } from "@playwright/test";

test.describe("Phase 2: Key Features & Validation (en)", () => {
  test("should allow a user to resume a session after refreshing", async ({
    page,
  }) => {
    await page.goto("/en/assessment");

    // Fill out the first step
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "40-49" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Female" }).click();
    await page.getByLabel("Height").fill("165");
    await page.getByLabel("Weight").fill("60");
    await page.getByRole("button", { name: "Next" }).click();

    // Now on step 2, check the title to confirm
    await expect(
      page.getByRole("heading", { name: "Lifestyle Habits" }),
    ).toBeVisible();

    // Refresh the page
    await page.reload();

    // Expect the resume dialog to appear
    await expect(
      page.getByRole("heading", { name: "Resume Session?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Resume" }).click();

    // Verify we are still on step 2, not step 1
    await expect(
      page.getByRole("heading", { name: "Lifestyle Habits" }),
    ).toBeVisible();

    // Go back and check if data from step 1 is preserved
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("combobox", { name: "Female" })).toBeVisible();
    await expect(page.getByLabel("Height")).toHaveValue("165");
  });

  test("should show validation errors for height and weight fields", async ({
    page,
  }) => {
    await page.goto("/en/assessment");

    const heightInput = page.getByLabel("Height");
    const weightInput = page.getByLabel("Weight");
    const nextButton = page.getByRole("button", { name: "Next" });

    // Metric validation
    await heightInput.fill("abc");
    await expect(page.getByText("Please enter a valid number.")).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await heightInput.fill("-10");
    await expect(page.getByText("Value must be positive.")).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await heightInput.fill("40");
    await expect(
      page.getByText("Please enter a height between 50 and 300 cm."),
    ).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await heightInput.fill("170"); // Valid
    await expect(
      page.getByText("Please enter a height between 50 and 300 cm."),
    ).not.toBeVisible();

    // Switch to Imperial and test weight
    await page.getByRole("tab", { name: "Imperial (inches / lbs)" }).click();

    await weightInput.fill("30");
    await expect(
      page.getByText("Please enter a weight between 40 and 660 lbs."),
    ).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await weightInput.fill("700");
    await expect(
      page.getByText("Please enter a weight between 40 and 660 lbs."),
    ).toBeVisible();
    await expect(nextButton).toBeDisabled();

    await weightInput.fill("150"); // Valid
    await expect(
      page.getByText("Please enter a weight between 40 and 660 lbs."),
    ).not.toBeVisible();

    // Fill out rest of step to enable Next button
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "18-29" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Male" }).click();

    await expect(nextButton).toBeEnabled();
  });

  test("should show conditional questions based on smoking status", async ({
    page,
  }) => {
    // Navigate to step 2
    await page.goto("/en/assessment");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "18-29" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Male" }).click();
    await page.getByLabel("Height").fill("180");
    await page.getByLabel("Weight").fill("80");
    await page.getByRole("button", { name: "Next" }).click();

    const smokingDurationQuestion = page.getByText(
      "For how many years have you been smoking?",
    );
    const quitYearsQuestion = page.getByText(
      "How many years has it been since you quit smoking?",
    );

    // Initially, neither should be visible
    await expect(smokingDurationQuestion).not.toBeVisible();
    await expect(quitYearsQuestion).not.toBeVisible();

    // Select "Current smoker"
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Current smoker" }).click();
    await expect(smokingDurationQuestion).toBeVisible();
    await expect(quitYearsQuestion).not.toBeVisible();

    // Select "Former smoker"
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Former smoker" }).click();
    await expect(smokingDurationQuestion).not.toBeVisible();
    await expect(quitYearsQuestion).toBeVisible();

    // Select "Never smoked"
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Never smoked" }).click();
    await expect(smokingDurationQuestion).not.toBeVisible();
    await expect(quitYearsQuestion).not.toBeVisible();
  });

  test("should handle PDF and Email exports on the results page", async ({
    page,
  }) => {
    // Complete a minimal assessment to get to the results page
    await page.goto("/en/assessment");
    for (let i = 0; i < 6; i++) {
      // Step 1
      if (i === 0) {
        await page.getByRole("combobox").first().click();
        await page.getByRole("option", { name: "18-29" }).click();
        await page.getByRole("combobox").nth(1).click();
        await page.getByRole("option", { name: "Male" }).click();
        await page.getByLabel("Height").fill("180");
        await page.getByLabel("Weight").fill("80");
      } else {
        // For subsequent steps, just select the first available option.
        const selects = await page.getByRole("combobox").all();
        for (const select of selects) {
          await select.click();
          await page.getByRole("option").first().click();
        }
      }
      if (i < 5) await page.getByRole("button", { name: "Next" }).click();
    }

    // Mock API response for results page
    await page.route("**/api/assess", async (route) => {
      await route.fulfill({
        json: {
          overallSummary: "This is a mock summary for export tests.",
          recommendedScreenings: [],
          lifestyleGuidelines: [],
          topicsForDoctor: [],
        },
      });
    });

    await page.getByRole("button", { name: "View Results" }).click();
    await expect(
      page.getByRole("heading", { name: "Your Preventive Health Plan" }),
    ).toBeVisible();

    // Test PDF Download
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download as PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /Doctors_Discussion_Guide_.*\.pdf/,
    );

    // Test Email Export
    let emailRequestPayload: any = null;
    await page.route("**/api/export/email", async (route) => {
      emailRequestPayload = route.request().postDataJSON();
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.getByRole("button", { name: "Email My Plan" }).click();
    await expect(
      page.getByRole("heading", { name: "Email Your Plan" }),
    ).toBeVisible();
    await page.getByPlaceholder("you@example.com").fill("test@example.com");
    await page.getByRole("button", { name: "Send Email" }).click();

    // Assert that the success toast appears and the dialog closes
    await expect(page.getByText("Email Sent")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Email Your Plan" }),
    ).not.toBeVisible();

    // Assert the API was called with the correct data
    expect(emailRequestPayload.recipientEmail).toBe("test@example.com");
    expect(emailRequestPayload.assessmentData).toBeDefined();
    expect(emailRequestPayload.answers).toBeDefined(); // Check that answers are included
    expect(emailRequestPayload.assessmentData.overallSummary).toBe(
      "This is a mock summary for export tests.",
    );
  });
});

test.describe("Phase 4: Static Pages & Footer", () => {
  test("should handle footer navigation, language switching, and theme toggling", async ({
    page,
  }) => {
    await page.goto("/en");

    // Test Privacy Policy link
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/en/privacy");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeVisible();
    await page.goBack();

    // Test Terms of Service link
    await expect(page).toHaveURL("/en");
    await page.getByRole("link", { name: "Terms of Service" }).click();
    await expect(page).toHaveURL("/en/terms");
    await expect(
      page.getByRole("heading", { name: "Terms of Service" }),
    ).toBeVisible();
    
    // Test Language Switcher
    await page.getByRole("link", { name: "PL" }).click();
    await expect(page).toHaveURL("/pl/terms");
    await expect(page.getByRole("heading", { name: "Warunki Korzystania z Usługi"})).toBeVisible();
    await page.getByRole("link", { name: "EN" }).click();
    await expect(page).toHaveURL("/en/terms");
    
    await page.goBack();


    // Test Theme Toggle
    const html = page.locator("html");
    const themeToggleButton = page.getByRole("button", {
      name: "Toggle theme",
    });

    // Check initial state (assuming light mode in test runner)
    await expect(html).not.toHaveClass(/dark/);

    // Toggle to dark mode
    await themeToggleButton.click();
    await expect(html).toHaveClass(/dark/);

    // Navigate and check if theme persists
    await page.getByRole("link", { name: "Privacy Policy" }).click();
    await expect(page).toHaveURL("/en/privacy");
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light mode
    await themeToggleButton.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
      