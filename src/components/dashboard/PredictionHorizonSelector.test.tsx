/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "@/app/dashboard/page";
import {
  useUserProfile,
  useAnalyticsData,
  useGenerateTopics,
  useSuggestedTopics,
  usePracticeAnalytics,
  useOnboardUser,
  useDashboardTutorChat,
} from "@/lib/hooks/data";
import { useLanguageStore } from "@/lib/stores/language.store";

// Mock dependencies
jest.mock("@/lib/hooks/data", () => ({
  useUserProfile: jest.fn(),
  useAnalyticsData: jest.fn(),
  useGenerateTopics: jest.fn(),
  useSuggestedTopics: jest.fn(),
  usePracticeAnalytics: jest.fn(),
  useOnboardUser: jest.fn(),
  useDashboardTutorChat: jest.fn(),
}));
jest.mock("@/lib/stores/language.store");
jest.mock("@/components/dashboard/PredictionHorizonSelector", () => ({
  PredictionHorizonSelector: (props: any) => (
    <div data-testid="prediction-horizon-selector">
      <button onClick={() => props.onChange("1y")}>1Y</button>
    </div>
  ),
}));
jest.mock("@/components/ProficiencyChart", () => ({
  ProficiencyChart: () => <div />,
}));
jest.mock("@/components/SubskillProgressChart", () => ({
  SubskillProgressChart: () => <div />,
}));
jest.mock("@/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div />,
}));
jest.mock("@/components/JournalHistoryList", () => ({
  JournalHistoryList: () => <div />,
}));
jest.mock("@/components/SubskillScores", () => ({
  SubskillScores: () => <div />,
}));
jest.mock("@/components/dashboard/ChallengingConceptsCard", () => ({
  ChallengingConceptsCard: () => <div />,
}));

const mockedUseUserProfile = useUserProfile as jest.Mock;
const mockedUseAnalyticsData = useAnalyticsData as jest.Mock;
const mockedUseGenerateTopics = useGenerateTopics as jest.Mock;
const mockedUseSuggestedTopics = useSuggestedTopics as jest.Mock;
const mockedUsePracticeAnalytics = usePracticeAnalytics as jest.Mock;
const mockedUseOnboardUser = useOnboardUser as jest.Mock;
const mockedUseDashboardTutorChat = useDashboardTutorChat as jest.Mock;
const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;

const queryClient = new QueryClient();

const renderDashboard = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
};

const mockFullAnalyticsData = {
  totalEntries: 10,
  averageScore: 85,
  weakestSkill: "phrasing",
  proficiencyOverTime: [],
  subskillScores: { grammar: 80, phrasing: 70, vocabulary: 90 },
  recentJournals: [],
  subskillProficiencyOverTime: [],
  predictedProficiencyOverTime: [],
  predictedSubskillProficiencyOverTime: [],
  journalsThisWeek: 5,
  dueCounts: { today: 1, tomorrow: 2, week: 5 },
};

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUserProfile.mockReturnValue({
      data: { onboardingCompleted: true, subscriptionTier: "PRO" },
      isLoading: false,
    });
    mockedUseGenerateTopics.mockReturnValue({ mutate: jest.fn() });
    mockedUseSuggestedTopics.mockReturnValue({
      data: { topics: [] },
      isLoading: false,
    });
    mockedUsePracticeAnalytics.mockReturnValue({ data: [], isLoading: false });
    mockedUseOnboardUser.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    mockedUseDashboardTutorChat.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
  });

  it("does not render PredictionHorizonSelector when no prediction data is available", () => {
    mockedUseAnalyticsData.mockReturnValue({
      data: {
        ...mockFullAnalyticsData,
        totalEntries: 5,
        predictedProficiencyOverTime: [], // No predictions
        averageScore: 80,
        weakestSkill: "grammar",
      },
      isLoading: false,
    });

    renderDashboard();

    expect(
      screen.queryByTestId("prediction-horizon-selector"),
    ).not.toBeInTheDocument();
  });

  it("renders PredictionHorizonSelector when prediction data is available", () => {
    mockedUseAnalyticsData.mockReturnValue({
      data: {
        ...mockFullAnalyticsData,
        predictedProficiencyOverTime: [{ date: "2023-01-01", score: 50 }], // Predictions available
      },
      isLoading: false,
    });

    renderDashboard();

    const selectors = screen.getAllByTestId("prediction-horizon-selector");
    expect(selectors).toHaveLength(2);
  });
});