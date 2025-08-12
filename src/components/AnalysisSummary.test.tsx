/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { AnalysisSummary } from "./AnalysisSummary";

// Mock the Progress component from shadcn/ui to avoid dealing with its implementation details
jest.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress-bar" data-value={value} />
  ),
}));

describe("AnalysisSummary", () => {
  const defaultProps = {
    grammarScore: 85,
    phrasingScore: 75,
    vocabularyScore: 95,
    overallSummary: "Great job on your vocabulary usage!",
  };

  it("renders all score indicators with correct labels and percentages", () => {
    render(<AnalysisSummary {...defaultProps} />);

    expect(screen.getByText("Grammar")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();

    expect(screen.getByText("Phrasing")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    expect(screen.getByText("Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
  });

  it("passes the correct values to the Progress components", () => {
    render(<AnalysisSummary {...defaultProps} />);
    const progressBars = screen.getAllByTestId("progress-bar");
    expect(progressBars[0]).toHaveAttribute("data-value", "85");
    expect(progressBars[1]).toHaveAttribute("data-value", "75");
    expect(progressBars[2]).toHaveAttribute("data-value", "95");
  });

  it("renders the overall summary text when provided", () => {
    render(<AnalysisSummary {...defaultProps} />);
    expect(
      screen.getByText(`"${defaultProps.overallSummary}"`),
    ).toBeInTheDocument();
  });

  it("does not render the summary text when it is not provided", () => {
    const propsWithoutSummary = { ...defaultProps, overallSummary: undefined };
    render(<AnalysisSummary {...propsWithoutSummary} />);
    expect(
      screen.queryByText(`"${defaultProps.overallSummary}"`),
    ).not.toBeInTheDocument();
  });
});