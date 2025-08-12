
import { test as setup, expect } from "@playwright/test";

const authFile = ".auth/user.json";

setup("authenticate", async ({ page }) => {
  // This setup assumes a test user exists in the database.
  // For a real-world scenario, you would seed this user in a test-specific database.
  // The credentials should be stored in environment variables, not hardcoded.
  const testUserEmail = process.env.TEST_USER_EMAIL || "test@example.com";
  const testUserPassword =
    process.env.TEST_USER_PASSWORD || "PasswordForTesting123!";

  await page.goto("/login");
  await page.getByLabel("Email address").fill(testUserEmail);
  await page.getByLabel("Password").fill(testUserPassword);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for the page to redirect to the dashboard, confirming successful login.
  await expect(page).toHaveURL("/dashboard", { timeout: 20000 });

  // Accept the cookie banner if it appears, so it doesn't block other tests.
  const cookieBanner = page.getByText("We use cookies to enhance your experience.");
  if (await cookieBanner.isVisible()) {
    await page.getByRole("button", { name: "Accept" }).click();
  }

  // Programmatically ensure the user is onboarded to prevent the wizard from appearing.
  // This makes subsequent tests stable and independent of the onboarding flow.
  await page.request.post("/api/user/onboard", {
    data: {
      nativeLanguage: "english",
      targetLanguage: "spanish",
      writingStyle: "Casual",
      writingPurpose: "Personal",
      selfAssessedLevel: "Intermediate",
    },
  });

  await page.request.post("/api/user/complete-onboarding");

  // Reload the page to ensure the client-side state (like react-query cache)
  // is updated with the now-onboarded user profile.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
    timeout: 20000,
  });

  // Save the authentication state to a file.
  await page.context().storageState({ path: authFile });
});