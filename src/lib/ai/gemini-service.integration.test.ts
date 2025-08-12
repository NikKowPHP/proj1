/** @jest-environment node */
import { GeminiService } from "./gemini-service";

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

  it("should translate text correctly", async () => {
    const result = await service.generateText(
      "Translate 'Hello' to Spanish",
      "gemini-1.5-flash-latest",
    );
    expect(result.toLowerCase()).toContain("hola");
  });

  it("should analyze a journal entry and return a structured response", async () => {
    const journalContent = "I go to the beach. It was fun. I see a dog.";
    const prompt = `Analyze this journal entry written in English by a Spanish speaker and return JSON: "${journalContent}"`;
    const result = await service.generateJson<any>(
      prompt,
      "gemini-1.5-flash-latest",
    );

    expect(result).toBeDefined();
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