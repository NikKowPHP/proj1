import { getAnswerEvaluationPrompt } from "./answerEvaluation.prompt";
import type { EvaluationContext } from "@/lib/types";

describe("getAnswerEvaluationPrompt", () => {
  const context: EvaluationContext = {
    question: "What is a closure?",
    userAnswer: "It is a function.",
    idealAnswerSummary: "A function with access to its outer scope.",
  };

  it("should return a non-empty string", () => {
    const prompt = getAnswerEvaluationPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getAnswerEvaluationPrompt(context);
    expect(prompt).toContain(context.question);
    expect(prompt).toContain(context.userAnswer);
    expect(prompt).toContain(context.idealAnswerSummary);
  });
});
