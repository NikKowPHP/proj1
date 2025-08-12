import { getJournalingAidsPrompt } from "./journalingAids.prompt";

describe("getJournalingAidsPrompt", () => {
  const context = {
    topic: "My favorite food",
    targetLanguage: "French",
    proficiency: 30,
  };

  it("should return a non-empty string", () => {
    const prompt = getJournalingAidsPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getJournalingAidsPrompt(context);
    expect(prompt).toContain(context.topic);
    expect(prompt).toContain(context.targetLanguage);
    expect(prompt).toContain(String(context.proficiency));
  });
});
