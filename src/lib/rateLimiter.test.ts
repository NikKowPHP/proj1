describe("rateLimiter", () => {
  // Since we cannot directly access and clear the internal `memoryStore` from rateLimiter.ts,
  // we use jest.resetModules() in beforeEach. This ensures that each test gets a
  // fresh, un-cached version of the module, effectively resetting its state and
  // fulfilling the requirement for test isolation.
  beforeEach(() => {
    jest.resetModules();
  });

  describe("ipRateLimiter", () => {
    it("should allow requests under the limit of 20 per minute", () => {
      const { ipRateLimiter } = require("./rateLimiter");
      const ip = "192.168.1.1";
      for (let i = 0; i < 20; i++) {
        const result = ipRateLimiter(ip);
        expect(result.allowed).toBe(true);
      }
    });

    it("should block the 21st request in a minute", () => {
      const { ipRateLimiter } = require("./rateLimiter");
      const ip = "192.168.1.2";
      // First 20 requests should be allowed
      for (let i = 0; i < 20; i++) {
        ipRateLimiter(ip);
      }
      // 21st should be blocked
      const result = ipRateLimiter(ip);
      expect(result.allowed).toBe(false);
    });

    it("should return a valid retryAfter value when blocked", () => {
      const { ipRateLimiter } = require("./rateLimiter");
      const ip = "192.168.1.3";
      for (let i = 0; i < 20; i++) {
        ipRateLimiter(ip);
      }
      const result = ipRateLimiter(ip);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });
  });
});
      