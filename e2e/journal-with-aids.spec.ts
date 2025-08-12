import { test, expect } from "@playwright/test";

test.describe("Journaling with AI Aids", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should allow user to use translator, apply it, and submit for analysis", async ({
    page,
  }) => {
    await page.goto("/journal");
    await expect(page.getByRole("heading", { name: "My Journal" })).toBeVisible({
      timeout: 20000,
    });

    // 1. Open the Translator Dialog
    const editorToolbar = page.locator(".border-t");
    await editorToolbar
      .getByRole("button", { name: /translate/i })
      .first()
      .click();

    // 2. Use the Translator
    const dialog = page.getByRole("dialog", { name: "Translator" });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder(/Text in English/).fill("Good morning");
    await dialog.getByRole("button", { name: "Translate" }).click();

    // 3. Apply to Journal
    const outputTextarea = dialog.getByPlaceholder("Translation");
    await expect(outputTextarea).not.toBeEmpty({ timeout: 15000 });
    const translatedText = await outputTextarea.inputValue();
    expect(translatedText.toLowerCase()).toContain("buenos días");
    await dialog.getByRole("button", { name: "Apply to Journal" }).click();

    // 4. Verify Insertion & Submit
    const editor = page.locator(".ProseMirror");
    await expect(editor).toContainText(translatedText);
    await editor.fill(
      `${translatedText} This is a sufficiently long journal entry to pass the validation check upon submission.`,
    );
    await page.getByRole("button", { name: "Submit for Analysis" }).click();

    // 5. Wait for and Verify Analysis
    await expect(page).toHaveURL(/.*\/journal\/.*/, { timeout: 20000 });
    await expect(
      page.getByText("Analysis in Progress..."),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Analysis in Progress...")).not.toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByText("Your Original Text")).toBeVisible();
    await expect(page.getByText("Detailed Feedback")).toBeVisible();
  });
});