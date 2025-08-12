/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JournalPage from "./page";
import {
  useUserProfile,
  useJournalHistory,
  useSuggestedTopics,
  useGenerateImagePrompt,
  useAutocomplete,
  useStuckWriterSuggestions,
  useSubmitJournal,
  useContextualTranslate,
  useCreateSrsFromTranslation,
} from "@/lib/hooks/data";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useSearchParams } from "next/navigation";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock("@/lib/hooks/data", () => ({
  useUserProfile: jest.fn(),
  useJournalHistory: jest.fn(),
  useSuggestedTopics: jest.fn(),
  useGenerateTopics: jest.fn(() => ({ mutate: jest.fn() })),
  useGenerateImagePrompt: jest.fn(),
  useAutocomplete: jest.fn(),
  useStuckWriterSuggestions: jest.fn(),
  useSubmitJournal: jest.fn(), // Added mock
  useContextualTranslate: jest.fn(),
  useCreateSrsFromTranslation: jest.fn(),
}));
jest.mock("@/lib/stores/onboarding.store");
jest.mock("@/lib/stores/language.store", () => ({
  useLanguageStore: Object.assign(
    jest.fn().mockReturnValue({ activeTargetLanguage: "spanish" }),
    {
      getState: jest.fn().mockReturnValue({ activeTargetLanguage: "spanish" }),
    },
  ),
}));
jest.mock("@/components/LanguageSetupDialog", () => ({
  LanguageSetupDialog: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="language-setup-dialog"></div> : null,
}));
jest.mock("@/components/ui/GuidedPopover", () => ({
  GuidedPopover: ({
    isOpen,
    children,
    title,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="guided-popover" data-title={title}>
        {children}
      </div>
    ) : (
      <>{children}</>
    ),
}));
jest.mock("@/lib/hooks/useFeatureFlag", () => ({
  useFeatureFlag: jest.fn(() => [false, jest.fn()]),
}));

const mockedUseUserProfile = useUserProfile as jest.Mock;
const mockedUseJournalHistory = useJournalHistory as jest.Mock;
const mockedUseSuggestedTopics = useSuggestedTopics as jest.Mock;
const mockedUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;
const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;
const mockedUseGenerateImagePrompt = useGenerateImagePrompt as jest.Mock;
const mockedUseAutocomplete = useAutocomplete as jest.Mock;
const mockedUseStuckWriterSuggestions = useStuckWriterSuggestions as jest.Mock;
const mockedUseSubmitJournal = useSubmitJournal as jest.Mock; // Added mock variable
const mockUseContextualTranslate = useContextualTranslate as jest.Mock;
const mockedUseCreateSrsFromTranslation =
  useCreateSrsFromTranslation as jest.Mock;

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("JournalPage", () => {
  beforeEach(() => {
    // Reset mocks to a default "happy path" state for a complete user
    jest.clearAllMocks();
    mockedUseJournalHistory.mockReturnValue({ data: [], isLoading: false });
    mockedUseSuggestedTopics.mockReturnValue({
      data: { topics: [] },
      isLoading: false,
    });
    mockedUseOnboardingStore.mockReturnValue({ step: "INACTIVE" });

    // Restore mocks for useLanguageStore after clearAllMocks
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    (useLanguageStore as any).getState.mockReturnValue({
      activeTargetLanguage: "spanish",
    });

    mockedUseSearchParams.mockReturnValue(new URLSearchParams());
    // Complete profile by default
    mockedUseUserProfile.mockReturnValue({
      data: {
        onboardingCompleted: true,
        nativeLanguage: "english",
        defaultTargetLanguage: "spanish",
      },
      isLoading: false,
    });
    // Add default mock for the new hooks
    mockedUseGenerateImagePrompt.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    mockedUseAutocomplete.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    mockedUseStuckWriterSuggestions.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    mockedUseSubmitJournal.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    mockUseContextualTranslate.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    mockedUseCreateSrsFromTranslation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it("should render the LanguageSetupDialog for an incomplete user profile", () => {
    // Arrange: Mock an incomplete user profile
    mockedUseUserProfile.mockReturnValue({
      data: {
        onboardingCompleted: false,
        nativeLanguage: null, // This is the trigger condition
        defaultTargetLanguage: "spanish",
      },
      isLoading: false,
    });

    // Act
    render(<JournalPage />, { wrapper });

    // Assert
    expect(screen.getByTestId("language-setup-dialog")).toBeInTheDocument();
  });

  it("should NOT render the LanguageSetupDialog for a complete user profile", () => {
    // Arrange: Mock a complete user profile (default in beforeEach)

    // Act
    render(<JournalPage />, { wrapper });

    // Assert
    expect(
      screen.queryByTestId("language-setup-dialog"),
    ).not.toBeInTheDocument();
  });

  // NEW TEST
  it("should render GuidedPopover for FIRST_JOURNAL step", () => {
    mockedUseOnboardingStore.mockReturnValue({
      step: "FIRST_JOURNAL",
      isActive: true,
    });

    render(<JournalPage />, { wrapper });

    const popover = screen.getByTestId("guided-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute("data-title", "Your First Entry");
  });
});