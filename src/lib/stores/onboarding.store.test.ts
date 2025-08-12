
/** @jest-environment jsdom */
import { useOnboardingStore } from "./onboarding.store";

// A helper function to create a mock user profile
const createMockProfile = (overrides: any = {}) => ({
  id: "user-1",
  email: "test@test.com",
  supabaseAuthId: "user-1-supa",
  onboardingCompleted: false,
  _count: { srsItems: 0 },
  ...overrides,
});

// A helper function to create a mock journal entry
const createMockJournal = (overrides: any = {}) => ({
  id: "journal-1",
  authorId: "user-1",
  topicId: "topic-1",
  content: "This is a journal",
  targetLanguage: "spanish",
  createdAt: new Date(),
  updatedAt: new Date(),
  analysis: null,
  ...overrides,
});

describe("useOnboardingStore: determineCurrentStep", () => {
  const initialState = useOnboardingStore.getState();
  beforeEach(() => {
    // Reset the store to its initial state before each test
    useOnboardingStore.setState(initialState);
  });

  it("should set step to INACTIVE for a user with onboardingCompleted as true", () => {
    const { determineCurrentStep } = useOnboardingStore.getState();
    const profile = createMockProfile({ onboardingCompleted: true });

    determineCurrentStep({ userProfile: profile, journals: [] });

    expect(useOnboardingStore.getState().step).toBe("INACTIVE");
    expect(useOnboardingStore.getState().isActive).toBe(false);
  });

  it("should set step to PROFILE_SETUP for a new user with incomplete profile", () => {
    const { determineCurrentStep } = useOnboardingStore.getState();
    const profile = createMockProfile({ nativeLanguage: null });

    determineCurrentStep({ userProfile: profile, journals: [] });

    expect(useOnboardingStore.getState().step).toBe("PROFILE_SETUP");
    expect(useOnboardingStore.getState().isActive).toBe(true);
  });

  it("should set step to FIRST_JOURNAL for a user with a complete profile but no journals", () => {
    const { determineCurrentStep } = useOnboardingStore.getState();
    const profile = createMockProfile({
      nativeLanguage: "english",
      defaultTargetLanguage: "spanish",
    });

    determineCurrentStep({ userProfile: profile, journals: [] });

    expect(useOnboardingStore.getState().step).toBe("FIRST_JOURNAL");
    expect(useOnboardingStore.getState().isActive).toBe(true);
  });

  it("should set step to VIEW_ANALYSIS for a user with an unanalyzed journal", () => {
    const { determineCurrentStep } = useOnboardingStore.getState();
    const profile = createMockProfile({
      nativeLanguage: "english",
      defaultTargetLanguage: "spanish",
    });
    const journals = [createMockJournal({ analysis: null })];

    determineCurrentStep({ userProfile: profile, journals: journals as any });

    expect(useOnboardingStore.getState().step).toBe("VIEW_ANALYSIS");
    expect(useOnboardingStore.getState().isActive).toBe(true);
    expect(useOnboardingStore.getState().onboardingJournalId).toBe("journal-1");
  });

  it("should set step to VIEW_ANALYSIS for a user with an analyzed journal but no SRS items", () => {
    const { determineCurrentStep } = useOnboardingStore.getState();
    const profile = createMockProfile({
      nativeLanguage: "english",
      defaultTargetLanguage: "spanish",
      _count: { srsItems: 0 },
    });
    const journals = [createMockJournal({ analysis: { id: "analysis-1" } })];

    determineCurrentStep({ userProfile: profile, journals: journals as any });

    expect(useOnboardingStore.getState().step).toBe("VIEW_ANALYSIS");
    expect(useOnboardingStore.getState().isActive).toBe(true);
  });

  it("should set step to STUDY_INTRO for a user with an analyzed journal and SRS items", () => {
    const { determineCurrentStep } = useOnboardingStore.getState();
    const profile = createMockProfile({
      nativeLanguage: "english",
      defaultTargetLanguage: "spanish",
      _count: { srsItems: 1 },
    });
    const journals = [createMockJournal({ analysis: { id: "analysis-1" } })];

    determineCurrentStep({ userProfile: profile, journals: journals as any });

    expect(useOnboardingStore.getState().step).toBe("STUDY_INTRO");
    expect(useOnboardingStore.getState().isActive).toBe(true);
  });
});