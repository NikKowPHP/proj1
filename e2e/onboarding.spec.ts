import { test, expect } from "@playwright/test";

test.describe.serial("Full Onboarding Tour", () => {
  // This test requires a fresh, un-onboarded user for each run.
  // It must run serially to maintain state across steps.
  // For this to work, email verification MUST be disabled in the test Supabase project.
  const email = `onboarding-tour-user-${Date.now()}@example.com`;
  const password = "PasswordForTesting123!";
  let journalId: string;

  test("Step 1: Sign up and complete language setup", async ({ page }) => {
    // 1. Sign up.
    await page.goto("/signup");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Complete LanguageSetupDialog.
    const dialog = page.getByRole("dialog", { name: "Welcome to Lexity!" });
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByText("Let's get you set up.")).toBeVisible();

    // 3. Fill in the native and target languages and click "Save".
    await dialog.locator('button:has-text("Select your native language")').click();
    await page.getByRole("option", { name: "English" }).click();
    await dialog.locator('button:has-text("Select a language to learn")').click();
    await page.getByRole("option", { name: "Spanish" }).click();
    await dialog.getByRole("button", { name: "Save & Continue" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("Step 2: Follow prompt to first journal entry", async ({ page }) => {
    // 4. Navigate to journal page from dialog prompt.
    const dialog = page.getByRole("dialog", { name: "Your First Entry" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Go to Journal" }).click();
    await expect(page).toHaveURL(/.*journal/);
  });

  test("Step 3: Write first entry and submit", async ({ page }) => {
    // 5. See the Guided Popover and write the first entry.
    await expect(page.getByText("Your First Entry")).toBeVisible();
    const editor = page.locator(".ProseMirror");
    await editor.fill(
      "Hola, esto es mi primero diario. Yo ser un nuevo estudiante de español. Me gusta aprender.",
    );
    // As user types, the popover should disappear
    await expect(page.getByText("Your First Entry")).not.toBeVisible();

    await page.getByRole("button", { name: "Submit for Analysis" }).click();

    // 6. Verify navigation to analysis page and store the ID.
    await expect(page).toHaveURL(/.*\/journal\/.*/, { timeout: 20000 });
    const url = page.url();
    journalId = url.split("/").pop()!;
    expect(journalId).toBeTruthy();
  });

  test("Step 4: View analysis and add card to deck", async ({ page }) => {
    // This test re-navigates to ensure it works in isolation if needed,
    // but relies on `journalId` from the previous test.
    await page.goto(`/journal/${journalId}`);

    // 7. Wait for analysis to complete and see the Guided Popovers.
    await expect(page.getByText("Analysis in Progress...")).not.toBeVisible({
      timeout: 60000,
    });
    const analysisPopover = page.getByText("Review Your Feedback");
    await expect(analysisPopover).toBeVisible();
    // Dismiss it by clicking anywhere (simulated by clicking the card itself)
    await page.locator('[data-slot="card"]').first().click();
    await expect(analysisPopover).not.toBeVisible();

    const feedbackCard = page.locator('[id^="mistake-"]').first();
    await feedbackCard.scrollIntoViewIfNeeded();

    // 8. Reveal suggestion and see the "Create a Flashcard" popover.
    await feedbackCard.getByRole("button", { name: "Show Suggestion" }).click();
    const createFlashcardPopover = page.getByText("Create a Flashcard");
    await expect(createFlashcardPopover).toBeVisible();
    const addToDeckButton = feedbackCard.getByRole("button", {
      name: "Add to Study Deck",
    });
    await addToDeckButton.click();
    await expect(addToDeckButton).toHaveText(/Added/);
    await expect(createFlashcardPopover).not.toBeVisible();
  });

  test("Step 5: Navigate to study, review card, and go to read page", async ({ page }) => {
    // 9. Follow prompt to Study Page.
    const dialog = page.getByRole("dialog", { name: "Flashcard Created!" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Go to Study Page" }).click();
    await expect(page).toHaveURL(/.*study/);

    // 10. See the study intro popover and review the card.
    const studyPopover = page.getByText("Practice Makes Perfect");
    await expect(studyPopover).toBeVisible();
    const flashcard = page.locator('[data-slot="card"]');
    await flashcard.click(); // Flip card
    await page.getByRole("button", { name: "Good" }).click();
    await expect(studyPopover).not.toBeVisible(); // Should disappear after review
  });
  
  test("Step 6: Complete Read & Write, Drill, and Final Onboarding", async ({ page }) => {
    // 11. Follow prompt to Read & Write page
    const readDialog = page.getByRole("dialog", { name: "Practice Reading" });
    await expect(readDialog).toBeVisible();
    await readDialog.getByRole("button", { name: "Go to Reading Page" }).click();
    await expect(page).toHaveURL(/.*read/);
    
    // 12. See the summary popover, write, and submit
    await expect(page.getByText("Write a Summary")).toBeVisible();
    await expect(page.locator("article h2")).not.toBeEmpty({ timeout: 15000 });
    await page.locator(".ProseMirror").fill("Este es un resumen del texto que leí. Es lo suficientemente largo para pasar la validación y continuar con el tour de onboarding.");
    await page.getByRole("button", { name: "Submit for Analysis" }).click();

    // 13. Follow prompt back to study for drill
    const drillDialog = page.getByRole("dialog", { name: "Quick Practice Drill!" });
    await expect(drillDialog).toBeVisible();
    await drillDialog.getByRole("button", { name: "Go to Study Page" }).click();
    await expect(page).toHaveURL(/.*study/);

    // 14. See drill dialog with popover, dismiss it
    const drillPracticeDialog = page.getByRole("dialog", { name: "Quick Drill Session" });
    await expect(drillPracticeDialog).toBeVisible();
    await expect(drillPracticeDialog.getByText("Drill Your Knowledge")).toBeVisible();
    await drillPracticeDialog.getByRole('button', { name: 'Close' }).click();

    // 15. See final "Setup Complete" dialog and finish
    const completeDialog = page.getByRole("dialog", { name: "🎉 Setup Complete!" });
    await expect(completeDialog).toBeVisible();
    await completeDialog.getByRole("button", { name: "Explore Dashboard" }).click();
    
    // 16. Assert final state and checklist
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(completeDialog).not.toBeVisible();
    const checklist = page.getByText("Getting Started");
    await expect(checklist).toBeVisible();
    await checklist.getByRole('button', { name: 'Dismiss checklist' }).click();
    await expect(checklist).not.toBeVisible();
    await page.reload();
    await expect(checklist).not.toBeVisible();
  });
});