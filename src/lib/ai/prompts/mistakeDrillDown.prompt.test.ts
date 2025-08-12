import { getMistakeDrillDownPrompt } from "./mistakeDrillDown.prompt";

describe("getMistakeDrillDownPrompt", () => {
  const context = {
    original: "I goed to the store",
    corrected: "I went to the store",
    explanation: "Incorrect past tense of 'go'.",
    targetLanguage: "English",
    nativeLanguage: "Spanish",
  };

  it("should return a non-empty string", () => {
    const prompt = getMistakeDrillDownPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getMistakeDrillDownPrompt(context);
    expect(prompt).toContain(context.original);
    expect(prompt).toContain(context.corrected);
    expect(prompt).toContain(context.explanation);
    expect(prompt).toContain(context.targetLanguage);
    expect(prompt).toContain(context.nativeLanguage);
  });

  it("should instruct the AI to return a specific JSON structure with a type field", () => {
    const prompt = getMistakeDrillDownPrompt(context);
    expect(prompt).toContain('"type": "translate"');
    expect(prompt).toContain('"type": "fill-in-the-blank"');
    expect(prompt).toContain('"task":');
    expect(prompt).toContain('"answer":');
  });
});