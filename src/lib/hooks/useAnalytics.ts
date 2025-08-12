// src/lib/hooks/useAnalytics.ts
import { usePostHog } from "posthog-js/react";

const mockPostHog = {
  capture: () => {},
  identify: () => {},
  reset: () => {},
  // Add any other methods you might call to the mock
};

/**
 * A safe hook to access the PostHog instance.
 *
 * This hook retrieves the PostHog client from the context provided by `PostHogProvider`.
 * It wraps the `capture` method in a safety check to prevent analytics calls
 * from crashing the application in environments where PostHog is not available
 * (e.g., during tests, Storybook) or fails to initialize. In such cases, it returns
 * a mock object with no-op functions.
 *
 * @returns The fully-typed PostHog instance for use in components and hooks, or a mock object if unavailable.
 * @example
 * const analytics = useAnalytics();
 *
 * const handleClick = () => {
 *   analytics.capture('Button Clicked', { buttonName: 'Sign Up' });
 * };
 */
export const useAnalytics = () => {
  try {
    // This will throw if the provider is not found
    const posthog = usePostHog();

    // A safe wrapper for the capture function
    const capture: typeof posthog.capture = (...args) => {
      // Don't do anything if PostHog isn't configured to run
      if (!posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        return;
      }
      try {
        // Return the result of the original capture method
        return posthog.capture(...args);
      } catch (e) {
        console.error("PostHog capture error:", e);
        // Return undefined on error to match the expected return type
        return;
      }
    };

    return {
      ...posthog,
      capture, // Override with the safe version
    };
  } catch (error) {
    // This can happen in environments where the provider is not available.
    return mockPostHog;
  }
};