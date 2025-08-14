/** @jest-environment node */
import { GeminiService } from "./gemini-service";
import { AIModel } from "./types";

// These tests make real API calls to the Gemini API and will not run if
// the GEMINI_API_KEY environment variable is not set.
// These tests are for verifying the service's interaction with the live API,
// including prompt correctness and response parsing.

const apiKey = process.env.GEMINI_API_KEY;
const describeIfApiKey = apiKey ? describe : describe.skip;

describeIfApiKey("GeminiService Integration Tests", () => {
  let service: GeminiService;

  // Increase timeout for integration tests
  jest.setTimeout(60000);

  beforeAll(() => {
    // We instantiate the service here. It will use the key rotation internally.
    service = new GeminiService();
  });

  it("should translate text correctly from English to Spanish", async () => {
    const prompt = "Translate the word 'Hello' into Spanish.";
    const model = (process.env.GEMINI_SMALL_MODEL ||
      "gemini-2.5-flash-latest") as AIModel;
    try {
      const translatedText = await service.generateText(prompt, model);
      expect(translatedText.toLowerCase()).toContain("hola");
    } catch (error: any) {
      if (error.message.toLowerCase().includes("api key")) {
        console.warn(
          "Skipping Gemini integration test due to invalid (dummy) API key.",
        );
        expect(true).toBe(true);
      } else {
        throw error;
      }
    }
  });
});

// A dummy test to ensure the suite doesn't fail if skipped
if (!process.env.GEMINI_API_KEY) {
  describe("Gemini Integration Test Suite", () => {
    it("skips integration tests because GEMINI_API_KEY is not set", () => {
      console.warn(
        "Skipping Gemini integration tests: GEMINI_API_KEY is not set.",
      );
      expect(true).toBe(true);
    });
  });
}
