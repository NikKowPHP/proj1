import { getTitleGenerationPrompt } from "./titleGeneration.prompt";

describe("getTitleGenerationPrompt", () => {
  const journalContent =
    "Today I went to the park and saw a dog. It was a good day.";

  it("should return a non-empty string", () => {
    const prompt = getTitleGenerationPrompt(journalContent);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include the journal content in the prompt", () => {
    const prompt = getTitleGenerationPrompt(journalContent);
    expect(prompt).toContain(journalContent);
  });
});
