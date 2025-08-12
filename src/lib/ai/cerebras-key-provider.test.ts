/** @jest-environment node */
import * as keyProvider from "./cerebras-key-provider";

describe("Cerebras Key Provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // This is important to re-run the module initialization
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should load a single key from CEREBRAS_API_KEY", () => {
    // Delete all patterned keys to isolate this test case
    for (const key in process.env) {
      if (/^CEREBRAS_API_KEY_(\d+)$/.test(key)) {
        delete process.env[key];
      }
    }
    process.env.CEREBRAS_API_KEY = "single-key";
    const { getAllKeys, _resetForTesting } = require("./cerebras-key-provider");
    _resetForTesting();
    const keys = getAllKeys();
    expect(keys).toEqual(["single-key"]);
  });

  it("should load multiple keys from CEREBRAS_API_KEY_n in order", () => {
    process.env.CEREBRAS_API_KEY_2 = "key-two";
    process.env.CEREBRAS_API_KEY_1 = "key-one";
    const { getAllKeys, _resetForTesting } = require("./cerebras-key-provider");
    _resetForTesting();
    const keys = getAllKeys();
    expect(keys).toEqual(["key-one", "key-two"]);
  });

  it("should throw an error if no keys are found", () => {
    delete process.env.CEREBRAS_API_KEY;
    // Delete all patterned keys to ensure none are found
    for (const key in process.env) {
      if (/^CEREBRAS_API_KEY_(\d+)$/.test(key)) {
        delete process.env[key];
      }
    }
    // The error is thrown on module load because initializeKeys() is called.
    // We must wrap the require() call itself to catch the initialization error.
    expect(() => {
      require("./cerebras-key-provider");
    }).toThrow(
      "No Cerebras API keys found. Please set CEREBRAS_API_KEY or CEREBRAS_API_KEY_n in your environment.",
    );
  });

  it("should prioritize numbered keys over the single key", () => {
    process.env.CEREBRAS_API_KEY = "single-key";
    process.env.CEREBRAS_API_KEY_1 = "numbered-key";
    const { getAllKeys, _resetForTesting } = require("./cerebras-key-provider");
    _resetForTesting();
    const keys = getAllKeys();
    expect(keys).toEqual(["numbered-key"]);
  });
});