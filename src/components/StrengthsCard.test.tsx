/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { StrengthsCard } from "./StrengthsCard";

// Mock the ThumbsUp icon
jest.mock("lucide-react", () => ({
  ...jest.requireActual("lucide-react"),
  ThumbsUp: () => <div data-testid="thumbs-up-icon" />,
}));

describe("StrengthsCard", () => {
  const props = {
    text: "Excellent use of the subjunctive mood.",
    explanation:
      "You correctly used the subjunctive mood in the phrase 'I wish I were...'. This is an advanced concept that many learners struggle with.",
  };

  it("renders the main strength text", () => {
    render(<StrengthsCard {...props} />);
    expect(
      screen.getByText("Excellent use of the subjunctive mood."),
    ).toBeInTheDocument();
  });

  it("renders the explanation text", () => {
    render(<StrengthsCard {...props} />);
    expect(
      screen.getByText(
        "You correctly used the subjunctive mood in the phrase 'I wish I were...'. This is an advanced concept that many learners struggle with.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the ThumbsUp icon", () => {
    render(<StrengthsCard {...props} />);
    expect(screen.getByTestId("thumbs-up-icon")).toBeInTheDocument();
  });
});