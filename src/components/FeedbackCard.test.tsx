/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FeedbackCard } from "./FeedbackCard";

// Mock the child components
jest.mock("./PracticeSection", () => ({
  PracticeSection: (props: any) => (
    <div data-testid="practice-section">
      Practice for mistake: {props.mistakeId}
    </div>
  ),
}));
jest.mock("@/lib/hooks/data", () => ({
  useCreateSrsFromMistake: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    isSuccess: false,
  })),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("FeedbackCard", () => {
  const defaultProps = {
    original: "I goed to the store.",
    suggestion: "I went to the store.",
    explanation: "The past tense of 'go' is 'went'.",
    mistakeId: "mistake-123",
    onOnboardingAddToDeck: jest.fn(),
    isAlreadyInDeck: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders PracticeSection with correct props when suggestion is revealed", () => {
    render(<FeedbackCard {...defaultProps} />, { wrapper });
    const showButton = screen.getByRole("button", { name: "Show Suggestion" });
    fireEvent.click(showButton);

    const practiceSection = screen.getByTestId("practice-section");
    expect(practiceSection).toBeInTheDocument();
    expect(practiceSection).toHaveTextContent(
      "Practice for mistake: mistake-123",
    );
  });
});