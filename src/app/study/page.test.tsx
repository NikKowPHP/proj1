/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import StudyPage from "./page";
import { useLanguageStore } from "@/lib/stores/language.store";
import {
  useStudyDeck,
  useUserProfile,
  useDrillSession,
} from "@/lib/hooks/data";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock dependencies
jest.mock("@/lib/stores/language.store");
jest.mock("@/lib/stores/onboarding.store");
jest.mock("@/lib/hooks/data", () => ({
  useStudyDeck: jest.fn(),
  useUserProfile: jest.fn(),
  useDrillSession: jest.fn(),
}));
jest.mock("@/components/StudySession", () => ({
  StudySession: () => <div data-testid="study-session" />,
}));
jest.mock("@/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));
jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));
// I'll update this mock to pass through the title
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

const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;
const mockedUseStudyDeck = useStudyDeck as jest.Mock;
const mockedUseUserProfile = useUserProfile as jest.Mock;
const mockedUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;
const mockedUseDrillSession = useDrillSession as jest.Mock;

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("StudyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for onboarding store
    mockedUseOnboardingStore.mockReturnValue({
      step: "INACTIVE",
      setStep: jest.fn(),
    });
    // Default mock for user profile
    mockedUseUserProfile.mockReturnValue({
      data: { nativeLanguage: "english" },
      isLoading: false,
    });
    mockedUseDrillSession.mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  // ... (existing tests) ...
  it("shows a loading skeleton when useStudyDeck is loading", () => {
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    mockedUseStudyDeck.mockReturnValue({
      isLoading: true,
      data: null,
      error: null,
    });

    render(<StudyPage />, { wrapper });
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it('shows "Please select a language" message when no language is active', () => {
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: null });
    mockedUseStudyDeck.mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
    });

    render(<StudyPage />, { wrapper });
    expect(
      screen.getByText("Please select a language to start studying."),
    ).toBeInTheDocument();
  });

  it('shows "No cards are due" message when the deck is empty', () => {
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    mockedUseStudyDeck.mockReturnValue({
      isLoading: false,
      data: [],
      error: null,
    });

    render(<StudyPage />, { wrapper });
    expect(
      screen.getByText(/You have no cards due for review in Spanish/i),
    ).toBeInTheDocument();
  });

  it("renders the StudySession component when there are cards in the deck", () => {
    const mockCards = [
      {
        id: "1",
        frontContent: "Hello",
        backContent: "Hola",
        context: "Greeting",
      },
    ];
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    mockedUseStudyDeck.mockReturnValue({
      isLoading: false,
      data: mockCards,
      error: null,
    });

    render(<StudyPage />, { wrapper });
    expect(screen.getByTestId("study-session")).toBeInTheDocument();
  });

  it("displays an error message if useStudyDeck fails", () => {
    const error = new Error("Failed to fetch");
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    mockedUseStudyDeck.mockReturnValue({ isLoading: false, data: null, error });

    render(<StudyPage />, { wrapper });
    expect(
      screen.getByText("Error loading study deck: Failed to fetch"),
    ).toBeInTheDocument();
  });

  // NEW TESTS for onboarding
  it("should render GuidedPopover for STUDY_INTRO step", () => {
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    mockedUseStudyDeck.mockReturnValue({
      isLoading: false,
      data: [{ id: "1" }],
    });
    mockedUseOnboardingStore.mockReturnValue({
      step: "STUDY_INTRO",
      isActive: true,
      setStep: jest.fn(),
    });

    render(<StudyPage />, { wrapper });

    const popover = screen.getByTestId("guided-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute("data-title", "Practice Makes Perfect");
  });

  it("should open drill dialog and show popover for DRILL_INTRO step", () => {
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    mockedUseStudyDeck.mockReturnValue({ isLoading: false, data: [] });
    mockedUseDrillSession.mockReturnValue({
      data: [{ id: "1", frontContent: "Drill" }],
      isLoading: false,
      refetch: jest.fn(),
    });
    mockedUseOnboardingStore.mockReturnValue({
      step: "DRILL_INTRO",
      isActive: true,
      setStep: jest.fn(),
    });

    render(<StudyPage />, { wrapper });

    // The drill dialog is open and it contains the popover
    const popover = screen.getByTestId("guided-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute("data-title", "Drill Your Knowledge");
  });
});