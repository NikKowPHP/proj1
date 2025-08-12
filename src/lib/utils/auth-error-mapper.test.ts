
import { mapAuthError } from "./auth-error-mapper";

describe("mapAuthError", () => {
  it('should return a sanitized message for "Invalid login credentials"', () => {
    const result = mapAuthError("Invalid login credentials");
    expect(result.message).toBe("Incorrect email or password.");
  });

  it('should return a sanitized message for "User not found"', () => {
    const result = mapAuthError("user not found");
    expect(result.message).toBe("Incorrect email or password.");
  });

  it('should return a sanitized message for "Email not confirmed"', () => {
    const result = mapAuthError("Email not confirmed");
    expect(result.message).toBe(
      "Please check your inbox to verify your email address before logging in.",
    );
  });

  it('should return a sanitized message for "User already registered"', () => {
    const result = mapAuthError(
      "AuthApiError: User already registered",
    );
    expect(result.message).toBe("An account with this email already exists.");
  });

  it("should return a generic auth error for an unmapped message", () => {
    const result = mapAuthError("Some other unknown supabase error");
    expect(result.message).toBe(
      "An authentication error occurred. Please try again.",
    );
  });

  it("should return a default error for null or undefined input", () => {
    expect(mapAuthError(null).message).toBe(
      "An unexpected error occurred. Please try again.",
    );
    expect(mapAuthError(undefined).message).toBe(
      "An unexpected error occurred. Please try again.",
    );
  });
});