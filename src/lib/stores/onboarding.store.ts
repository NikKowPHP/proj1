import { create } from "zustand";
import type { User, JournalEntry, Analysis } from "@prisma/client";

export type OnboardingStep =
  | "PROFILE_SETUP"
  | "FIRST_JOURNAL"
  | "VIEW_ANALYSIS"
  | "CREATE_DECK"
  | "STUDY_INTRO"
  | "READ_WRITE_INTRO"
  | "DRILL_INTRO"
  | "COMPLETED"
  | "INACTIVE";

interface OnboardingContext {
  userProfile: User & { _count: { srsItems: number } };
  journals: (JournalEntry & { analysis: Analysis | null })[];
}

interface OnboardingState {
  step: OnboardingStep;
  isActive: boolean;
  onboardingJournalId: string | null;
  setStep: (step: OnboardingStep) => void;
  setOnboardingJournalId: (id: string | null) => void;
  resetOnboarding: () => void;
  determineCurrentStep: (context: OnboardingContext) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: "INACTIVE",
  isActive: false,
  onboardingJournalId: null,

  setStep: (step) =>
    set((state) => ({
      step,
      isActive: step !== "INACTIVE",
    })),

  setOnboardingJournalId: (id) => set({ onboardingJournalId: id }),

  resetOnboarding: () =>
    set({ step: "INACTIVE", isActive: false, onboardingJournalId: null }),

  determineCurrentStep: (context: OnboardingContext) => {
    const { userProfile, journals } = context;

    if (userProfile.onboardingCompleted) {
      set({ step: "INACTIVE", isActive: false });
      return;
    }

    const profileIsComplete = !!(
      userProfile.nativeLanguage && userProfile.defaultTargetLanguage
    );
    const hasJournals = journals && journals.length > 0;
    const hasSrsItems = (userProfile._count?.srsItems ?? 0) > 0;

    let nextStep: OnboardingStep = "INACTIVE";

    if (!profileIsComplete) {
      nextStep = "PROFILE_SETUP";
    } else if (!hasJournals) {
      nextStep = "FIRST_JOURNAL";
    } else {
      const latestJournal = journals[0];
      if (latestJournal) {
        // Store the latest journal ID for the tour
        set({ onboardingJournalId: latestJournal.id });
        if (!latestJournal.analysis) {
          nextStep = "VIEW_ANALYSIS"; // Waiting for analysis
        } else if (!hasSrsItems) {
          nextStep = "VIEW_ANALYSIS"; // Has analysis, needs to create a card
        } else {
          // User has entries and SRS items. The UI will guide them from here.
          nextStep = "STUDY_INTRO";
        }
      }
    }

    if (nextStep !== "INACTIVE") {
      set({ step: nextStep, isActive: true });
    }
  },
}));