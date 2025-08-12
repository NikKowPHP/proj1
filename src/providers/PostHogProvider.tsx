
// src/providers/PostHogProvider.tsx
"use client";

import React, { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { useAuthStore } from "@/lib/stores/auth.store";

if (typeof window !== "undefined" && process.env.NODE_ENV != 'development' ) {
  // Only initialize if the key is provided
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false, // We're handling page views manually if needed
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") posthog.debug();
        },
      });
    } catch (e) {
      console.error("PostHog initialization failed:", e);
    }
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Only try to identify if PostHog is configured
    if (posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      try {
        if (user) {
          posthog.identify(user.id, {
            email: user.email,
          });
        } else {
          posthog.reset();
        }
      } catch (e) {
        console.error("PostHog identify/reset failed:", e);
      }
    }
  }, [user]);

  return <Provider client={posthog}>{children}</Provider>;
}