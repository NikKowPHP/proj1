
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Unauthenticated user", () => {
    test("should redirect to login for protected routes", async ({ page }) => {
      await page.goto("/dashboard");
      // Wait for the navigation to the login page to complete.
      await page.waitForURL(/\/login/);
      // Now that we're on the login page, we can safely assert the text is visible.
      await expect(
        page.getByText("Please log in to access this page."),
      ).toBeVisible();
    });

    test("should display a sanitized error message for invalid credentials", async ({
      page,
    }) => {
      await page.goto("/login");
      // Use a valid email format but an incorrect password
      await page.getByLabel("Email address").fill("user@example.com");
      await page.getByLabel("Password").fill("WrongPassword123!");
      await page.getByRole("button", { name: "Sign In" }).click();

      // Assert that the sanitized, user-friendly message is visible
      await expect(page.getByText("Incorrect email or password.")).toBeVisible();

      // Assert that the raw, more specific API error message is NOT visible
      await expect(
        page.getByText("Invalid login credentials"),
      ).not.toBeVisible();
    });
  });

  test.describe("Authenticated user", () => {
    // All tests in this describe block use the authenticated state.
    test.use({ storageState: ".auth/user.json" });

    test("should allow a logged-in user to log out", async ({
      page,
      isMobile,
    }) => {
      await page.goto("/dashboard");
      await expect(
        page.getByRole("heading", { name: "Dashboard" }),
      ).toBeVisible({ timeout: 20000 });

      if (isMobile) {
        // Mobile flow: navigate to settings, then log out
        await page.getByRole("link", { name: "Settings" }).click();
        await expect(page).toHaveURL("/settings");
        await page.getByRole("button", { name: "Logout" }).click();
      } else {
        // Desktop flow: log out directly from the sidebar
        await page.getByRole("button", { name: "Logout" }).click();
      }

      // After logout, the session is invalid. Reloading the page should redirect to login.
      // This is more robust than checking for a client-side redirect to '/'.
      await page.reload();
      await expect(page).toHaveURL(/.*login/);
    });
  });

  // Note: Sign-up and password reset flows are not tested E2E due to the
  // complexity of programmatically handling email verification links.
  // The onboarding.spec.ts file covers a successful sign-up flow.
});