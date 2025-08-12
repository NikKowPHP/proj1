/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JournalAnalysisPage from "./page";
import {
  useJournalEntry,
  useStudyDeck,
  useUserProfile,
  useTutorChat,
} from "@/lib/hooks/data";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { useParams } from "next/navigation";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock("@/lib/hooks/data", () => ({
  useJournalEntry: jest.fn(),
  useStudyDeck: jest.fn(),
  useRetryJournalAnalysis: jest.fn(() => ({ mutate: jest.fn() })),
  useAnalyzeJournal: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
  useUserProfile: jest.fn(),
  useTutorChat: jest.fn(() => ({ mutate: jest.fn() })),
  useJournalTutorChat: jest.fn(() => ({ mutate: jest.fn() })),
}));
jest.mock("@/lib/stores/onboarding.store");
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
jest.mock("@/components/FeedbackCard", () => ({
  FeedbackCard: (props: any) => (
    <div data-testid="feedback-card" data-isonboarding={props.isOnboarding}></div>
  ),
}));
jest.mock("@/lib/hooks/useFeatureFlag");

const mockedUseJournalEntry = useJournalEntry as jest.Mock;
const mockedUseStudyDeck = useStudyDeck as jest.Mock;
const mockedUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;
const mockedUseParams = useParams as jest.Mock;
const mockedUseUserProfile = useUserProfile as jest.Mock;
const mockedUseTutorChat = useTutorChat as jest.Mock;
const mockedUseFeatureFlag = useFeatureFlag as jest.Mock;

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const mockJournalWithAnalysis = {
  content: "This is my journal entry.",
  topic: { title: "Test Topic", imageUrl: null },
  analysis: {
    grammarScore: 80,
    phrasingScore: 85,
    vocabScore: 90,
    rawAiResponse: {
      feedback: "Good work!",
      overallSummary: "A solid entry.",
      highlights: [],
      strengths: [],
      mistakes: [{ type: "grammar" }],
    },
    mistakes: [
      {
        id: "m1",
        type: "grammar",
        originalText: "goed",
        correctedText: "went",
        explanation: "tense",
      },
    ],
  },
};

describe("JournalAnalysisPage Onboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParams.mockReturnValue({ id: "123" });
    mockedUseStudyDeck.mockReturnValue({ data: [], isLoading: false });
    mockedUseUserProfile.mockReturnValue({
      data: { nativeLanguage: "english" },
      isLoading: false,
    });
    mockedUseTutorChat.mockReturnValue({ mutate: jest.fn() });
    mockedUseFeatureFlag.mockReturnValue([false, jest.fn()]); // Default to not showing new feature popovers in tests
  });

  it("should render GuidedPopover for VIEW_ANALYSIS step", () => {
    mockedUseOnboardingStore.mockReturnValue({
      step: "VIEW_ANALYSIS",
      isActive: true,
      setStep: jest.fn(),
    });
    mockedUseJournalEntry.mockReturnValue({
      data: mockJournalWithAnalysis,
      isLoading: false,
    });

    render(<JournalAnalysisPage />, { wrapper });

    const popover = screen.getByTestId("guided-popover");
    expect(popover).toBeInTheDocument();
    expect(popover).toHaveAttribute("data-title", "Review Your Feedback");
  });

  it("should pass isOnboarding prop to FeedbackCard for VIEW_ANALYSIS step", () => {
    mockedUseOnboardingStore.mockReturnValue({
      step: "VIEW_ANALYSIS",
      isActive: true,
      setStep: jest.fn(),
    });
    mockedUseJournalEntry.mockReturnValue({
      data: mockJournalWithAnalysis,
      isLoading: false,
    });

    render(<JournalAnalysisPage />, { wrapper });

    const feedbackCard = screen.getByTestId("feedback-card");
    expect(feedbackCard).toBeInTheDocument();
    expect(feedbackCard).toHaveAttribute("data-isonboarding", "true");
  });
});