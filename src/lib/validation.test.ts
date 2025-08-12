import {
  validateEmail,
  validatePassword,
  calculatePasswordStrength,
} from "./validation";

describe("validation utilities", () => {
  describe("validateEmail", () => {
    it("should return valid for a correct email", () => {
      expect(validateEmail("test@example.com").valid).toBe(true);
    });

    it("should return invalid for an email without an '@'", () => {
      const result = validateEmail("testexample.com");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Please enter a valid email address");
    });

    it("should return invalid for an email without a top-level domain", () => {
      const result = validateEmail("test@example");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Please enter a valid email address");
    });

    it("should return invalid for an email with leading/trailing spaces", () => {
      const result = validateEmail(" test@example.com ");
      expect(result.valid).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should return valid for a strong password", () => {
      expect(validatePassword("StrongP@ssw0rd").valid).toBe(true);
    });

    it("should return invalid for a password that's too short", () => {
      const result = validatePassword("Shrt1@");
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "Password must be at least 8 characters long",
      );
    });

    it("should return invalid for a password without an uppercase letter", () => {
      const result = validatePassword("nouppercase@123");
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "Password must contain at least one uppercase letter",
      );
    });

    it("should return invalid for a password without a lowercase letter", () => {
      const result = validatePassword("NOLOWERCASE@123");
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "Password must contain at least one lowercase letter",
      );
    });

    it("should return invalid for a password without a number", () => {
      const result = validatePassword("NoNumberHere@");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Password must contain at least one number");
    });

    it("should return invalid for a password without a special character", () => {
      const result = validatePassword("NoSpecialChar1");
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "Password must contain at least one special character",
      );
    });
  });

  describe("calculatePasswordStrength", () => {
    it("should return 0 for an empty password", () => {
      expect(calculatePasswordStrength("")).toBe(0);
    });

    it("should return 1 for only having lowercase letters", () => {
      expect(calculatePasswordStrength("abc")).toBe(1);
    });

    it("should return 2 for having lowercase and uppercase letters", () => {
      expect(calculatePasswordStrength("abcABC")).toBe(2);
    });

    it("should return 4 for having lowercase, uppercase, and numbers, plus length", () => {
      expect(calculatePasswordStrength("abcABC123")).toBe(4);
    });

    it("should return 5 for having all criteria", () => {
      expect(calculatePasswordStrength("abcABC123!@#")).toBe(5);
    });

    it("should get an additional point for being long enough", () => {
      expect(calculatePasswordStrength("long enough")).toBe(2); // length + lowercase
      expect(calculatePasswordStrength("Long enough")).toBe(3); // length + lower + upper
      expect(calculatePasswordStrength("Long enough1")).toBe(4); // length + lower + upper + number
      expect(calculatePasswordStrength("Long enough1!")).toBe(5); // all 5 criteria
    });

    it("should return 5 for a strong password", () => {
      expect(calculatePasswordStrength("StrongP@ssw0rd")).toBe(5);
    });
  });
});
