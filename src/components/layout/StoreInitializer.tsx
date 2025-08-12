"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import {
  useUserProfile,
  useJournalHistory,
  useStudyDeck,
} from "@/lib/hooks/data";
import { useLanguageStore } from "@/lib/stores/language.store";

function StoreInitializer() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const { step, determineCurrentStep, resetOnboarding } = useOnboardingStore();
  const { activeTargetLanguage, setActiveTargetLanguage } = useLanguageStore();

  // Auth state listener
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      unsubscribe();
    };
  }, [initializeAuth]);

  // Data fetching hooks
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.authLoading);
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { data: journals, isLoading: isJournalsLoading } = useJournalHistory();
  useStudyDeck(); // Keep this hook active for caching, even if loading state isn't used here.

  // Effect 1: Set the active language as soon as the profile is available.
  // This unblocks other data hooks that depend on the active language.
  useEffect(() => {
    if (user && userProfile && !activeTargetLanguage) {
      if (userProfile.defaultTargetLanguage) {
        setActiveTargetLanguage(userProfile.defaultTargetLanguage);
      } else if (
        userProfile.languageProfiles &&
        userProfile.languageProfiles.length > 0
      ) {
        setActiveTargetLanguage(userProfile.languageProfiles[0].language);
      }
    }
  }, [user, userProfile, activeTargetLanguage, setActiveTargetLanguage]);

  // Effect 2: Determine the onboarding step once all necessary data is loaded.
  useEffect(() => {
    // We must wait for auth, profile, and journals to be loaded before making a decision.
    if (authLoading || isProfileLoading || isJournalsLoading) {
      return;
    }

    if (user && userProfile) {
      if (!userProfile.onboardingCompleted) {
        determineCurrentStep({
          userProfile: userProfile,
          journals: journals || [],
        });
      } else if (step !== "INACTIVE") {
        resetOnboarding();
      }
    }
  }, [
    user,
    userProfile, // Re-run when profile data changes
    journals, // Re-run when journal data changes
    authLoading,
    isProfileLoading,
    isJournalsLoading,
    determineCurrentStep,
    step,
    resetOnboarding,
  ]);

  return null;
}

export default StoreInitializer;