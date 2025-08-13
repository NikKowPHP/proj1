/** @jest-environment node */
import { CerebrasService } from "./cerebras-service";

// These tests make real API calls to the Cerebras API and will not run if
// the CEREBRAS_API_KEY or CEREBRAS_API_KEY_1 environment variable is not set.
const apiKey = process.env.CEREBRAS_API_KEY || process.env.CEREBRAS_API_KEY_1;
const describeIfApiKey = apiKey ? describe : describe.skip;

describeIfApiKey("CerebrasService Integration Tests", () => {
  let service: CerebrasService;

  // Increase timeout for integration tests
  jest.setTimeout(60000);

  beforeAll(() => {
    service = new CerebrasService();
  });

  it("should translate text correctly from English to Spanish", async () => {
    const prompt = "Translate the word 'Hello' into Spanish.";
    const model = process.env.CEREBRAS_SMALL_MODEL || "qwen-3-32b";
    const translatedText = await service.generateText(prompt, model);
    expect(translatedText.toLowerCase()).toContain("hola");
  });
});

// A dummy test to ensure the suite doesn't fail if skipped
if (!apiKey) {
  describe("Cerebras Integration Test Suite", () => {
    it("skips integration tests because CEREBRAS_API_KEY is not set", () => {
      console.warn(
        "Skipping Cerebras integration tests: CEREBRAS_API_KEY is not set.",
      );
      expect(true).toBe(true);
    });
  });
}
