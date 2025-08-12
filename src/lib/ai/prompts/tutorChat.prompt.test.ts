import { getTutorChatSystemPrompt } from "./tutorChat.prompt";

describe("getTutorChatSystemPrompt", () => {
  const context = {
    mistakeContext: {
      original: "I goed to the store.",
      corrected: "I went to the store.",
      explanation: "The past tense of 'go' is 'went'.",
    },
    targetLanguage: "English",
    nativeLanguage: "Spanish",
  };

  it("should return a non-empty string", () => {
    const prompt = getTutorChatSystemPrompt(context);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include all context variables in the prompt", () => {
    const prompt = getTutorChatSystemPrompt(context);
    expect(prompt).toContain(context.mistakeContext.original);
    expect(prompt).toContain(context.mistakeContext.corrected);
    expect(prompt).toContain(context.mistakeContext.explanation);
    expect(prompt).toContain(context.targetLanguage);
    expect(prompt).toContain(context.nativeLanguage);
  });

  it("should instruct the AI to respond in the user's native language", () => {
    const prompt = getTutorChatSystemPrompt(context);
    expect(prompt).toContain(
      "Primarily communicate in the user's native language, which is **Spanish**.",
    );
  });

  it("should instruct the AI to stay on topic", () => {
    const prompt = getTutorChatSystemPrompt(context);
    expect(prompt).toContain("Strictly stay on topic.");
  });

  it("should instruct the AI to respond only with text", () => {
    const prompt = getTutorChatSystemPrompt(context);
    expect(prompt).toContain(
      "Respond ONLY with the text of your message. Do not use JSON, markdown, or any other formatting.",
    );
  });
});