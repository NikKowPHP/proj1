import { test, expect } from "@playwright/test";

test.describe("Journal-Wide AI Tutor", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should allow user to open tutor, ask a question, and receive a response", async ({
    page,
  }) => {
    // 1. Setup: Create a journal entry and get it analyzed to ensure there's an analysis page to visit.
    await page.goto("/journal");
    await page
      .locator(".ProseMirror")
      .fill("This is a test entry about my vacation. I goed to the beach and it was very sunny. The water was warm.");
    await page.getByRole("button", { name: "Submit for Analysis" }).click();

    await expect(page).toHaveURL(/.*\/journal\/.*/, { timeout: 20000 });
    await expect(page.getByText("Analysis in Progress...")).not.toBeVisible({
      timeout: 60000,
    });
    
    // 2. Mock the API response for the tutor chat
    const mockAIResponse = "Your main issue was with the past tense of 'go'. You used 'goed' instead of 'went'. Everything else was great!";
    await page.route("**/api/ai/journal-tutor-chat", async (route) => {
        await route.fulfill({ json: { response: mockAIResponse } });
    });

    // 3. Find and click the "Ask About This Entry" button.
    const askButton = page.getByRole('button', { name: /Ask About This Entry/i });
    await askButton.scrollIntoViewIfNeeded();
    await askButton.click();

    // 4. Verify the dialog opens with the correct context.
    const dialog = page.getByRole('dialog', { name: "Chat about your journal entry" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/This is a test entry about my vacation/)).toBeVisible();

    // 5. Send a message.
    const chatInput = dialog.getByPlaceholder("Ask a follow-up question...");
    await chatInput.fill("What was my biggest issue here?");
    await dialog.getByRole('button', { name: 'Send' }).click();

    // 6. Verify the user's message and the AI's mocked response appear in the chat.
    await expect(dialog.getByText("What was my biggest issue here?")).toBeVisible();
    await expect(dialog.getByText(mockAIResponse)).toBeVisible({ timeout: 10000 });
  });
});