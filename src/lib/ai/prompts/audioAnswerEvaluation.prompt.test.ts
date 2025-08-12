import { getAudioAnswerEvaluationPrompt } from "./audioAnswerEvaluation.prompt";
import type { AudioEvaluationContext } from "@/lib/types";

describe("getAudioAnswerEvaluationPrompt", () => {
  const context: Omit<AudioEvaluationContext, "audioBuffer" | "mimeType"> = {
    question: "What is SSR?",
    idealAnswerSummary: "Server-Side Rendering.",
  };

  it("should return a non-empty string", () => {
    const prompt = getAudioAnswerEvaluationPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getAudioAnswerEvaluationPrompt(context);
    expect(prompt).toContain(context.question);
    expect(prompt).toContain(context.idealAnswerSummary);
  });
});
