import { getSentenceEvaluationPrompt } from "./sentenceEvaluation.prompt";

describe("getSentenceEvaluationPrompt", () => {
  const context = {
    sentence: "I went to the store.",
    concept: "The past tense of 'go' is 'went'.",
    targetLanguage: "English",
    nativeLanguage: "Spanish",
  };

  it("should return a non-empty string", () => {
    const prompt = getSentenceEvaluationPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getSentenceEvaluationPrompt(context);
    expect(prompt).toContain(context.sentence);
    expect(prompt).toContain(context.concept);
    expect(prompt).toContain(context.targetLanguage);
    expect(prompt).toContain(context.nativeLanguage);
  });

  it("should instruct the AI to return a specific JSON structure", () => {
    const prompt = getSentenceEvaluationPrompt(context);
    expect(prompt).toContain('"isCorrect": "boolean');
    expect(prompt).toContain('"feedback": "A very short, one-sentence feedback');
  });
});