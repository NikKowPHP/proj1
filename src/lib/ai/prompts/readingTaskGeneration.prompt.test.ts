import { getReadingTaskGenerationPrompt } from "./readingTaskGeneration.prompt";

describe("getReadingTaskGenerationPrompt", () => {
  it("should generate a prompt with the correct language, level, and content", () => {
    const prompt = getReadingTaskGenerationPrompt(
      "A story about a dog.",
      "French",
      "BEGINNER",
    );
    expect(prompt).toContain("French");
    expect(prompt).toContain("A1/A2 (beginner)");
    expect(prompt).toContain("A story about a dog.");
    expect(prompt).toContain(
      `"prompt": "Your Prompt for Summary Task in French"`,
    );
  });
});