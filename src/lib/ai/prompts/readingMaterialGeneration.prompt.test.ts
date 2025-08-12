import { getReadingMaterialGenerationPrompt } from "./readingMaterialGeneration.prompt";

describe("getReadingMaterialGenerationPrompt", () => {
  it("should include the target language and level, and request a JSON structure for BEGINNER", () => {
    const prompt = getReadingMaterialGenerationPrompt("German", "BEGINNER");
    expect(prompt).toContain("German");
    expect(prompt).toContain("A1/A2 (beginner)");
    expect(prompt).toContain(
      `"title": "A short, simple title for the story in German."`,
    );
    expect(prompt).toContain(
      `"content": "The full text of the story in German."`,
    );
  });

  it("should include the correct CEFR level for INTERMEDIATE", () => {
    const prompt = getReadingMaterialGenerationPrompt("French", "INTERMEDIATE");
    expect(prompt).toContain("B1/B2 (intermediate)");
  });
});