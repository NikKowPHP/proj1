import { test, expect } from "@playwright/test";

test.describe("Image Description Flow", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should allow user to generate, describe, and analyze an image prompt", async ({
    page,
  }) => {
    // 1. Intercept the API call to provide a predictable image topic
    const mockImageUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
    const mockTopic = {
      id: "mock-topic-123",
      title: "a serene lake at sunset",
      imageUrl: mockImageUrl,
      type: "IMAGE",
    };

    await page.route("**/api/image-prompt", async (route) => {
      await route.fulfill({ json: mockTopic });
    });

    // 2. Navigate to the journal and select the "Describe Image" mode
    await page.goto("/journal");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Describe Image" }).click();

    // 3. Verify the mocked image is displayed
    const image = page.locator(`img[src="${mockImageUrl}"]`);
    await expect(image).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(mockTopic.title)).toBeVisible();

    // 4. Write a description for the image
    const description = "The image shows a beautiful mountain reflected in a calm lake during sunset. The sky has vibrant colors, and there are trees on the shore. It is a very peaceful scene.";
    await page.locator(".ProseMirror").fill(description);

    // 5. Submit for analysis
    await page.getByRole("button", { name: "Submit for Analysis" }).click();

    // 6. Verify navigation to the analysis page and wait for results
    await expect(page).toHaveURL(/.*\/journal\/.*/, { timeout: 20000 });
    await expect(page.getByText("Analysis in Progress...")).not.toBeVisible({ timeout: 60000 });

    // 7. Verify the image is present on the analysis page for context
    const analysisImage = page.locator(`img[src="${mockImageUrl}"]`);
    await expect(analysisImage).toBeVisible();
    await expect(page.getByText(`Image context for your entry: "${mockTopic.title}"`)).toBeVisible();

    // 8. Verify the analysis content is visible
    await expect(page.getByRole("heading", { name: "Key Takeaways" })).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });
});