import { getDrillDownAnswerEvaluationPrompt } from "./drillDownAnswerEvaluation.prompt";

describe("getDrillDownAnswerEvaluationPrompt", () => {
  const context = {
    taskPrompt: "Translate from Spanish: 'Me gusta leer.'",
    expectedAnswer: "I like to read.",
    userAnswer: "I like reading.",
    targetLanguage: "English",
    nativeLanguage: "Spanish",
  };

  it("should return a non-empty string", () => {
    const prompt = getDrillDownAnswerEvaluationPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getDrillDownAnswerEvaluationPrompt(context);
    expect(prompt).toContain(context.taskPrompt);
    expect(prompt).toContain(context.expectedAnswer);
    expect(prompt).toContain(context.userAnswer);
    expect(prompt).toContain(context.targetLanguage);
    expect(prompt).toContain(context.nativeLanguage);
  });

  it("should instruct the AI to return a specific JSON structure", () => {
    const prompt = getDrillDownAnswerEvaluationPrompt(context);
    expect(prompt).toContain('"isCorrect": "boolean');
    expect(prompt).toContain('"score": "A numerical score from 0 to 100');
    expect(prompt).toContain('"feedback": "A concise, encouraging feedback message');
    expect(prompt).toContain('"correctedAnswer": "If \'isCorrect\' is false');
  });
});