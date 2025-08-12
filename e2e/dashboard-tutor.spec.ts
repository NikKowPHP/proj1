import { test, expect } from "@playwright/test";

test.describe("Dashboard AI Tutor", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should allow a user to open, get a greeting, and chat with the AI coach", async ({
    page,
  }) => {
    // 1. Navigate to the dashboard.
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({
      timeout: 20000,
    });

    // 2. Mock the initial API call for the proactive greeting.
    const initialGreeting =
      "Hi there! I'm Lexi. I've been looking at your progress in Spanish. It looks like you're making steady improvements. How can I help you with your learning goals?";
    await page.route("**/api/ai/dashboard-tutor-chat", async (route, request) => {
        const body = request.postDataJSON();
        if (body.chatHistory.length === 1) { // This is the initial greeting request
            await route.fulfill({ json: { response: initialGreeting } });
        }
    });

    // 3. Find and click the Floating Action Button.
    const tutorFab = page.getByRole("button", { name: "Ask AI Coach" });
    await tutorFab.click();

    // 4. Verify the dialog opens and the greeting appears.
    const dialog = page.getByRole("dialog", { name: "Chat with your AI Coach" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(initialGreeting)).toBeVisible({ timeout: 15000 });

    // 5. Mock the subsequent chat response.
    const followUpResponse = "That's a great question! Based on your recent entries, focusing on subjunctive mood would be most beneficial.";
     await page.route("**/api/ai/dashboard-tutor-chat", async (route, request) => {
        const body = request.postDataJSON();
        if (body.chatHistory.length > 1) { // This is a follow-up
            await route.fulfill({ json: { response: followUpResponse } });
        }
    });

    // 6. Send a message.
    const chatInput = dialog.getByPlaceholder("Ask about your progress...");
    const userMessage = "What should I focus on next?";
    await chatInput.fill(userMessage);
    await dialog.getByRole("button", { name: "Send" }).click();

    // 7. Verify the user's message and the AI's follow-up response appear.
    await expect(dialog.getByText(userMessage)).toBeVisible();
    await expect(dialog.getByText(followUpResponse)).toBeVisible({ timeout: 15000 });
  });
});