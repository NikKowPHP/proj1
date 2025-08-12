
import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";
import { mapAuthError } from "@/lib/utils/auth-error-mapper";

interface AuthState {
  user: User | null;
  authLoading: boolean; // For initial session check
  formLoading: boolean; // For form submissions
  error: string | null;
  initialize: () => () => void; // Returns the unsubscribe function
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; data?: any }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authLoading: true,
  formLoading: false,
  error: null,

  initialize: () => {
    const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Sync user with our backend on initial load or sign-in to ensure profile exists.
        if (
          (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
          session?.user
        ) {
          fetch("/api/auth/sync-user", { method: "POST" }).catch((e) =>
            console.error("Failed to sync user on auth state change:", e),
          );
        }

        // Update the store with the new session and set loading to false.
        set({ user: session?.user ?? null, authLoading: false });
      },
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  },

  signIn: async (email, password) => {
    set({ error: null, formLoading: true });
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in");
      }
      const supabase = createClient();
      if (data.session) {
        await supabase.auth.setSession(data.session);
        // Manually update the store state to prevent race conditions in tests.
        set({ user: data.user, formLoading: false, error: null });
      } else {
        await supabase.auth.refreshSession(); // Fallback to trigger listener
      }
      if (posthog) posthog.capture("User Signed In");
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      const errorMessage = error.message;

      let finalMessage: string;
      if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("fetch")
      ) {
        finalMessage =
          "A network error occurred. Please check your connection and try again.";
      } else {
        finalMessage = mapAuthError(errorMessage).message;
      }

      set({ error: finalMessage, formLoading: false, user: null });
      return false;
    }
  },

  signUp: async (email, password) => {
    set({ error: null, formLoading: true });
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      if (data.session) {
        const supabase = createClient();
        await supabase.auth.setSession(data.session);
        // Manually update the store state for immediate consistency.
        set({ user: data.user, formLoading: false, error: null });
        if (posthog) posthog.capture("User Signed Up");
      } else if (data?.user?.confirmation_sent_at) {
        if (posthog)
          posthog.capture("User Signed Up", {
            verification_required: true,
          });
        set({ formLoading: false });
      }

      return { success: true, data };
    } catch (err: unknown) {
      const error = err as Error;
      const errorMessage = error.message;

      let finalMessage: string;
      if (
        errorMessage.toLowerCase().includes("network") ||
        errorMessage.toLowerCase().includes("fetch")
      ) {
        finalMessage =
          "A network error occurred. Please check your connection and try again.";
      } else {
        finalMessage = mapAuthError(errorMessage).message;
      }
      set({ error: finalMessage, formLoading: false });
      return { success: false };
    }
  },

  signOut: async () => {
    set({ formLoading: true });
    if (posthog) posthog.capture("User Signed Out");
    const supabase = createClient();
    await supabase.auth.signOut();
    // The listener will handle setting user to null and loading to false.
    set({ formLoading: false });
  },

  clearError: () => set({ error: null }),
}));