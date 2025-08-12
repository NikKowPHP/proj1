/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudySession } from "./StudySession";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock dependencies
jest.mock("@/lib/hooks/data/useReviewSrsItem", () => ({
  useReviewSrsItem: jest.fn(() => ({ mutate: jest.fn() })),
}));
jest.mock("./Flashcard", () => ({
  Flashcard: ({ frontContent, onReview }: any) => (
    <div>
      <span>{frontContent}</span>
      <button onClick={() => onReview(0)}>Forgot</button>
      <button onClick={() => onReview(3)}>Good</button>
      <button onClick={() => onReview(5)}>Easy</button>
    </div>
  ),
}));
jest.mock("@/lib/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ capture: jest.fn() }),
}));

const queryClient = new QueryClient();

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

const mockCards = [
  { id: "1", frontContent: "Card A", type: "MISTAKE", interval: 1, easeFactor: 2.5 },
  { id: "2", frontContent: "Card B", type: "MISTAKE", interval: 1, easeFactor: 2.5 },
  { id: "3", frontContent: "Card C", type: "MISTAKE", interval: 1, easeFactor: 2.5 },
];

describe("StudySession Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should move a card to the end of the queue when 'Forgot' is clicked", () => {
    renderWithProvider(<StudySession cards={mockCards as any} />);

    // Initial state: Card A is visible
    expect(screen.getByText("Card A")).toBeVisible();
    expect(screen.queryByText("Card B")).not.toBeInTheDocument();
    expect(screen.getByText("Card 1 of 3")).toBeVisible();

    // User forgets Card A
    fireEvent.click(screen.getByRole("button", { name: /Forgot/i }));

    // Next card should be Card B
    expect(screen.getByText("Card B")).toBeVisible();
    expect(screen.queryByText("Card A")).not.toBeInTheDocument();
    expect(screen.getByText("Card 2 of 3")).toBeVisible();

    // User gets Card B correct
    fireEvent.click(screen.getByRole("button", { name: /Good/i }));

    // Next card should be Card C
    expect(screen.getByText("Card C")).toBeVisible();
    expect(screen.queryByText("Card B")).not.toBeInTheDocument();
    expect(screen.getByText("Card 3 of 3")).toBeVisible();

    // User gets Card C correct
    fireEvent.click(screen.getByRole("button", { name: /Good/i }));

    // Now, the forgotten Card A should reappear
    expect(screen.getByText("Card A")).toBeVisible();
    expect(screen.queryByText("Card C")).not.toBeInTheDocument();
    // The counter tracks total reviews in the session, which is now 4
    expect(screen.getByText("Card 4 of 3")).toBeVisible();

    // User finally gets Card A correct
    fireEvent.click(screen.getByRole("button", { name: /Good/i }));

    // Session should now be complete
    expect(screen.getByText("Session Complete!")).toBeVisible();
  });

  it("should end the session when all cards are reviewed correctly", () => {
    renderWithProvider(<StudySession cards={mockCards as any} />);

    // Review all cards with 'Good'
    fireEvent.click(screen.getByRole("button", { name: /Good/i })); // Card A
    expect(screen.getByText("Card 2 of 3")).toBeVisible();
    
    fireEvent.click(screen.getByRole("button", { name: /Good/i })); // Card B
    expect(screen.getByText("Card 3 of 3")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Good/i })); // Card C

    // Session should be complete
    expect(screen.getByText("Session Complete!")).toBeVisible();
  });
});