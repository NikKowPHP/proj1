import { test, expect } from "@playwright/test";

test.describe("Journaling, Practice, and SRS Flow", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should complete the full learning loop from mistake to SRS", async ({
    page,
  }) => {
    // 1. Submit a journal entry with a known mistake
    await page.goto("/journal");
    await page.getByRole("button", { name: "Suggest New Topics" }).click();
    const topicButton = page.locator('[data-slot="card-content"] button').first();
    await expect(topicButton).toBeVisible({ timeout: 20000 });
    await topicButton.click();
    await page
      .locator(".ProseMirror")
      .fill("This is a test. I goed to the store. This is more text to make it long enough.");
    await page.getByRole("button", { name: "Submit for Analysis" }).click();

    // 2. Wait for analysis and reveal suggestion
    await expect(page).toHaveURL(/.*\/journal\/.*/, { timeout: 20000 });
    await expect(page.getByText("Analysis in Progress...")).not.toBeVisible({ timeout: 60000 });
    const feedbackCard = page.locator('[id^="mistake-"]').first();
    await feedbackCard.scrollIntoViewIfNeeded();
    await feedbackCard.getByRole("button", { name: "Show Suggestion" }).click();

    // 3. Start practicing the concept
    const practiceButton = feedbackCard.getByRole("button", { name: "Practice this concept" });
    await practiceButton.click();
    const practiceTextarea = page.getByPlaceholder("Type your answer here...").first();
    await expect(practiceTextarea).toBeVisible({ timeout: 20000 });
    const checkAnswersButton = page.getByRole('button', { name: 'Check Answers' });

    // 4. Intentionally fail the practice 3 times to make it a "challenging concept"
    for (let i = 0; i < 3; i++) {
        await practiceTextarea.fill(`This is wrong attempt ${i}`);
        await checkAnswersButton.click();
        await expect(page.getByText(/Try Again!/)).toBeVisible();
    }

    // 5. Add the failed practice item to the study deck
    const addToDeckButton = page.getByRole('button', { name: 'Add to Deck' }).first();
    await expect(addToDeckButton).toBeVisible();
    await addToDeckButton.click();
    await expect(page.getByText("Added to Deck")).toBeVisible();

    // 6. Navigate to dashboard and verify the "Challenging Concept" card
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    const challengingConceptsCard = page.locator('[data-slot="card"]:has-text("Concepts to Review")');
    await expect(challengingConceptsCard).toBeVisible({ timeout: 10000 });
    await expect(challengingConceptsCard.getByText(/The past tense of 'go' is 'went'./)).toBeVisible();

    // 7. Click "Practice Now" from the dashboard and verify the dialog
    await challengingConceptsCard.getByRole('button', { name: 'Practice Now' }).click();
    const practiceDialog = page.getByRole('dialog', { name: 'Practice Concept' });
    await expect(practiceDialog).toBeVisible();
    await expect(practiceDialog.getByText(/Translate from/)).toBeVisible(); // Check for practice task
    // Close the dialog
    await page.getByRole('button', { name: 'Close' }).click();

    // 8. Navigate to the study page and verify the practice card is there
    await page.goto('/study');
    await expect(page.getByRole('heading', { name: 'Study Deck (SRS)' })).toBeVisible();
    const practiceTaskText = await practiceDialog.getByText(/Translate from/).innerText();
    await expect(page.getByText(practiceTaskText)).toBeVisible();
  });
});