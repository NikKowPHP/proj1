
import { test, expect } from "@playwright/test";

test.describe("Spaced Repetition System (SRS) Flow", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should allow user to add a mistake to SRS and review it", async ({
    page,
  }) => {
    // Setup: Create a journal entry with a known mistake to get a feedback card.
    await page.goto("/journal");
    await expect(page.getByRole("heading", { name: "My Journal" })).toBeVisible({
      timeout: 20000,
    });
    // Ensure the language is set before submitting. The test user defaults to Spanish.
    // Use a more complex, unambiguously incorrect sentence to ensure AI catches it.
    await page
      .locator(".ProseMirror")
      .fill("I goed to the store yesterday and buyed some milks.");
    await page.getByRole("button", { name: "Submit for Analysis" }).click();
    await expect(page).toHaveURL(/.*\/journal\/.*/, { timeout: 20000 });
    await expect(page.getByText("Analysis in Progress...")).not.toBeVisible({
      timeout: 60000,
    });

    // 1. Add Card from Mistake
    const feedbackCard = page
      .locator('[data-slot="card"]:has-text("Suggested Correction")')
      .first();
    await expect(feedbackCard).toBeVisible();
    const addToDeckButton = feedbackCard.getByRole("button", {
      name: "Add to Study Deck",
    });
    await addToDeckButton.click();
    await expect(addToDeckButton).toHaveText(/Added to Deck/);

    // 2. Review Card
    await page.goto("/study");
    await expect(
      page.getByRole("heading", { name: "Study Deck (SRS)" }),
    ).toBeVisible({ timeout: 20000 });
    const flashcardFront = page.locator(".text-lg.font-medium.text-center", {
      hasText: "I goed to the store yesterday and buyed some milks.",
    });
    await expect(flashcardFront).toBeVisible();

    // Flip the card
    await flashcardFront.click();
    await expect(
      page.locator(".text-lg.font-medium.text-center", {
        hasText: "I went to the store yesterday and bought some milk.",
      }),
    ).toBeVisible();

    // 3. Complete review
    await page.getByRole("button", { name: /Good/ }).click();

    // 4. Complete session
    await expect(page.getByText("Session Complete!")).toBeVisible();
  });
});