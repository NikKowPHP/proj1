
describe("rateLimiter", () => {
  // Since we cannot directly access and clear the internal `memoryStore` from rateLimiter.ts,
  // we use jest.resetModules() in beforeEach. This ensures that each test gets a
  // fresh, un-cached version of the module, effectively resetting its state and
  // fulfilling the requirement for test isolation.
  beforeEach(() => {
    jest.resetModules();
  });

  describe("authRateLimiter", () => {
    it("should allow requests under the limit of 10 per minute", () => {
      const { authRateLimiter } = require("./rateLimiter");
      const ip = "192.168.1.1";
      for (let i = 0; i < 10; i++) {
        const result = authRateLimiter(ip);
        expect(result.allowed).toBe(true);
      }
    });

    it("should block the 11th request in a minute", () => {
      const { authRateLimiter } = require("./rateLimiter");
      const ip = "192.168.1.2";
      // First 10 requests should be allowed
      for (let i = 0; i < 10; i++) {
        authRateLimiter(ip);
      }
      // 11th should be blocked
      const result = authRateLimiter(ip);
      expect(result.allowed).toBe(false);
    });

    it("should return a valid retryAfter value when blocked", () => {
      const { authRateLimiter } = require("./rateLimiter");
      const ip = "192.168.1.3";
      for (let i = 0; i < 10; i++) {
        authRateLimiter(ip);
      }
      const result = authRateLimiter(ip);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe("tieredRateLimiter", () => {
    it("should block a FREE user after 5 requests", () => {
      const { tieredRateLimiter } = require("./rateLimiter");
      const freeUserId = "free-user-id";
      // The default limit for FREE tier is 5.
      for (let i = 0; i < 5; i++) {
        const result = tieredRateLimiter(freeUserId, "FREE");
        expect(result.allowed).toBe(true);
      }
      const result = tieredRateLimiter(freeUserId, "FREE");
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should not block a PRO user after 5 requests", () => {
      const { tieredRateLimiter } = require("./rateLimiter");
      const proUserId = "pro-user-id";
      for (let i = 0; i < 10; i++) {
        // test more than 5
        const result = tieredRateLimiter(proUserId, "PRO");
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe("ttsRateLimiter", () => {
    it("should allow a FREE user up to 50 requests", () => {
      const { ttsRateLimiter } = require("./rateLimiter");
      const userId = "tts-free-user";
      for (let i = 0; i < 50; i++) {
        const result = ttsRateLimiter(userId, "FREE");
        expect(result.allowed).toBe(true);
      }
    });

    it("should block the 51st request for a FREE user", () => {
      const { ttsRateLimiter } = require("./rateLimiter");
      const userId = "tts-free-user-blocked";
      for (let i = 0; i < 50; i++) {
        ttsRateLimiter(userId, "FREE");
      }
      const result = ttsRateLimiter(userId, "FREE");
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should not block a PRO user after 50 requests", () => {
      const { ttsRateLimiter } = require("./rateLimiter");
      const userId = "tts-pro-user";
      for (let i = 0; i < 100; i++) {
        const result = ttsRateLimiter(userId, "PRO");
        expect(result.allowed).toBe(true);
      }
    });
  });
});