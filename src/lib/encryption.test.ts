
describe("Encryption Service", () => {
  const originalKey = process.env.APP_ENCRYPTION_KEY;

  beforeEach(() => {
    // Ensure the key is set for most tests from the jest setup
    process.env.APP_ENCRYPTION_KEY =
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    jest.resetModules(); // Re-import modules with current env vars
  });

  afterEach(() => {
    // Restore original key state
    if (originalKey) {
      process.env.APP_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.APP_ENCRYPTION_KEY;
    }
    jest.resetModules();
  });

  it("should throw an error if APP_ENCRYPTION_KEY is not set for encryption, but return null for decryption", () => {
    delete process.env.APP_ENCRYPTION_KEY;
    const { encrypt, decrypt } = require("./encryption");

    expect(() => encrypt("some text")).toThrow(
      "APP_ENCRYPTION_KEY is not set in environment variables.",
    );
    expect(decrypt("some:encrypted:text")).toBeNull();
  });

  it("should correctly encrypt and decrypt a simple string", () => {
    const { encrypt, decrypt } = require("./encryption");
    const text = "Hello, World!";
    const encrypted = encrypt(text);
    expect(encrypted).not.toBe(text);
    expect(typeof encrypted).toBe("string");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it("should handle multi-byte UTF-8 characters correctly", () => {
    const { encrypt, decrypt } = require("./encryption");
    const text = "你好, 世界! 🌍";
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it("should handle long text blocks correctly", () => {
    const { encrypt, decrypt } = require("./encryption");
    const longText = "a".repeat(10000);
    const encrypted = encrypt(longText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(longText);
  });

  describe("Edge Case Inputs", () => {
    it("should handle empty string by encrypting it and decrypting back to an empty string", () => {
      const { encrypt, decrypt } = require("./encryption");
      const encrypted = encrypt("");
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toBe("");
      expect(decrypt(encrypted)).toBe("");
    });

    it("should handle null input by encrypting it as an empty string, and decrypting null returns null", () => {
      const { encrypt, decrypt } = require("./encryption");
      const encrypted = encrypt(null);
      expect(typeof encrypted).toBe("string");
      expect(decrypt(encrypted)).toBe("");
      expect(decrypt(null)).toBeNull();
    });

    it("should handle undefined input by encrypting it as an empty string, and decrypting undefined returns null", () => {
      const { encrypt, decrypt } = require("./encryption");
      const encrypted = encrypt(undefined);
      expect(typeof encrypted).toBe("string");
      expect(decrypt(encrypted)).toBe("");
      expect(decrypt(undefined)).toBeNull();
    });
  });

  describe("Error Handling for Decryption", () => {
    it("should return null for invalid encrypted data format", () => {
      const { decrypt } = require("./encryption");
      expect(decrypt("invalid-format")).toBeNull();
      expect(decrypt("too:few:parts")).toBeNull();
    });

    it("should return null if decryption fails due to wrong key (auth tag mismatch)", () => {
      const { encrypt } = require("./encryption");
      const text = "some data";
      const encrypted = encrypt(text);

      // Simulate a different key
      process.env.APP_ENCRYPTION_KEY =
        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=";
      jest.resetModules(); // Re-import with the new key
      const { decrypt: decryptWithWrongKey } = require("./encryption");

      expect(decryptWithWrongKey(encrypted)).toBeNull();
    });

    it("should return null if the ciphertext is tampered with", () => {
      const { encrypt, decrypt } = require("./encryption");
      const text = "important data";
      const encrypted = encrypt(text);
      const parts = encrypted.split(":");
      // Tamper with the ciphertext part
      parts[2] = parts[2].slice(0, -4) + "ffff";
      const tampered = parts.join(":");

      expect(decrypt(tampered)).toBeNull();
    });
  });
});