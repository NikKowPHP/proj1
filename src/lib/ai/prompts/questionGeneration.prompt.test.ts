import { getQuestionGenerationPrompt } from "./questionGeneration.prompt";
import type { GenerationContext } from "@/lib/types";

describe("getQuestionGenerationPrompt", () => {
  it("should generate a prompt with all context details", () => {
    const context: GenerationContext = {
      role: "Senior Frontend Developer",
      difficulty: "Hard",
      count: 2,
    };

    const prompt = getQuestionGenerationPrompt(context);

    expect(prompt).toContain(context.role);
    expect(prompt).toContain(context.difficulty);
    expect(prompt).toContain(String(context.count));
    expect(prompt).toContain(
      "generate 2 high-quality, open-ended interview question(s)",
    );
  });
});
