import { getSentenceCompletionPrompt } from "./sentenceCompletion.prompt";

describe("getSentenceCompletionPrompt", () => {
  const text = "I am going to the";

  it("should return a non-empty string", () => {
    const prompt = getSentenceCompletionPrompt(text);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include the text in the prompt", () => {
    const prompt = getSentenceCompletionPrompt(text);
    expect(prompt).toContain(text);
  });
});
