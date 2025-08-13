/** @jest-environment node */
import { GroqService } from "./groq-service";

// These tests make real API calls to the Groq API and will not run if
// the GROQ_API_KEY or GROQ_API_KEY_1 environment variable is not set.
const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_1;
const describeIfApiKey = apiKey ? describe : describe.skip;

describeIfApiKey("GroqService Integration Tests", () => {
  let service: GroqService;

  // Increase timeout for integration tests
  jest.setTimeout(60000);

  beforeAll(() => {
    service = new GroqService();
  });

  it("should translate text correctly from English to Spanish", async () => {
    const prompt = "Translate the word 'Hello' into Spanish.";
    const model = process.env.GROQ_SMALL_MODEL || "gemma2-9b-it";
    const translatedText = await service.generateText(prompt, model);
    expect(translatedText.toLowerCase()).toContain("hola");
  });
});

// A dummy test to ensure the suite doesn't fail if skipped
if (!apiKey) {
  describe("Groq Integration Test Suite", () => {
    it("skips integration tests because GROQ_API_KEY is not set", () => {
      console.warn(
        "Skipping Groq integration tests: GROQ_API_KEY is not set.",
      );
      expect(true).toBe(true);
    });
  });
}
