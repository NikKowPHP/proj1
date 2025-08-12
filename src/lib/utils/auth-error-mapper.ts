
const defaultError = "An unexpected error occurred. Please try again.";

// This map helps sanitize raw API error messages into user-friendly ones.
// Keys are lowercase strings to look for in the raw error message.
const errorMap: { [key: string]: string } = {
  "invalid login credentials": "Incorrect email or password.",
  "user not found": "Incorrect email or password.",
  "email not confirmed":
    "Please check your inbox to verify your email address before logging in.",
  "password should be at least 6 characters": "Password is too short.",
  "user already registered": "An account with this email already exists.",
  "to create a user, please provide either an email or a phone number":
    "Please enter a valid email address.",
  "rate limit exceeded": "Too many attempts. Please try again in a few minutes.",
};

export const mapAuthError = (errorMessage: string | undefined | null) => {
  if (!errorMessage) {
    return { message: defaultError };
  }

  const lowerCaseMessage = errorMessage.toLowerCase();

  for (const key in errorMap) {
    if (lowerCaseMessage.includes(key)) {
      return { message: errorMap[key] };
    }
  }

  // If no specific match, return a generic but safe error.
  return { message: "An authentication error occurred. Please try again." };
};