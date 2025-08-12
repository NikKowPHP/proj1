import { getStuckWriterPrompt } from "./stuckWriter.prompt";
import type { StuckWriterContext } from "@/lib/types";

describe("getStuckWriterPrompt", () => {
  const context: StuckWriterContext = {
    topic: "My vacation",
    currentText: "I went to the beach.",
    targetLanguage: "Spanish",
  };

  it("should return a non-empty string", () => {
    const prompt = getStuckWriterPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getStuckWriterPrompt(context);
    expect(prompt).toContain(context.topic);
    expect(prompt).toContain(context.currentText);
    expect(prompt).toContain(context.targetLanguage);
  });
});
