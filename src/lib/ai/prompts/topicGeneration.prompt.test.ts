import { getTopicGenerationPrompt } from "./topicGeneration.prompt";

describe("getTopicGenerationPrompt", () => {
  const context = {
    targetLanguage: "German",
    proficiency: 75,
    count: 5,
  };

  it("should return a non-empty string", () => {
    const prompt = getTopicGenerationPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getTopicGenerationPrompt(context);
    expect(prompt).toContain(context.targetLanguage);
    expect(prompt).toContain(String(context.proficiency));
    expect(prompt).toContain(String(context.count));
  });
});
