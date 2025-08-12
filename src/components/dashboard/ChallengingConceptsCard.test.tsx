/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ChallengingConceptsCard,
  type Concept,
} from "./ChallengingConceptsCard";

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

const mockOnPractice = jest.fn();

const mockConcepts: Concept[] = [
  {
    mistakeId: "1",
    averageScore: 45,
    attempts: 5,
    explanation: "Incorrect use of subjunctive mood.",
    originalText: "a",
    correctedText: "b",
  },
  {
    mistakeId: "2",
    averageScore: 55,
    attempts: 3,
    explanation: "Confusion between 'ser' and 'estar'.",
    originalText: "c",
    correctedText: "d",
  },
];

describe("ChallengingConceptsCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders skeletons when loading", () => {
    render(
      <ChallengingConceptsCard
        concepts={[]}
        isLoading={true}
        onPractice={mockOnPractice}
      />,
    );
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders null when not loading and there are no concepts", () => {
    const { container } = render(
      <ChallengingConceptsCard
        concepts={[]}
        isLoading={false}
        onPractice={mockOnPractice}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders concept details correctly", () => {
    render(
      <ChallengingConceptsCard
        concepts={mockConcepts}
        isLoading={false}
        onPractice={mockOnPractice}
      />,
    );
    expect(
      screen.getByText(/Incorrect use of subjunctive mood./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Avg. Score: 45%/)).toBeInTheDocument();
    expect(screen.getByText(/5 attempts/)).toBeInTheDocument();

    expect(
      screen.getByText(/Confusion between 'ser' and 'estar'./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Avg. Score: 55%/)).toBeInTheDocument();
    expect(screen.getByText(/3 attempts/)).toBeInTheDocument();
  });

  it("calls onPractice with the correct concept when 'Practice Now' is clicked", () => {
    render(
      <ChallengingConceptsCard
        concepts={mockConcepts}
        isLoading={false}
        onPractice={mockOnPractice}
      />,
    );
    const practiceButtons = screen.getAllByRole("button", {
      name: /Practice Now/i,
    });
    expect(practiceButtons).toHaveLength(2);

    fireEvent.click(practiceButtons[0]);
    expect(mockOnPractice).toHaveBeenCalledTimes(1);
    expect(mockOnPractice).toHaveBeenCalledWith(mockConcepts[0]);

    fireEvent.click(practiceButtons[1]);
    expect(mockOnPractice).toHaveBeenCalledTimes(2);
    expect(mockOnPractice).toHaveBeenCalledWith(mockConcepts[1]);
  });
});