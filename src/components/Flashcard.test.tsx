/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Flashcard } from "./Flashcard";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ...jest.requireActual("lucide-react"),
  CheckCircle2: () => <div data-testid="check-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  XCircle: () => <div data-testid="x-icon" />,
}));

// Mock TTSButton to inspect its props
jest.mock("./ui/TTSButton", () => ({
  TTSButton: ({ text, lang }: { text: string; lang: string }) => (
    <div data-testid="tts-button" data-text={text} data-lang={lang} />
  ),
}));
jest.mock("./ui/GuidedPopover", () => ({
  GuidedPopover: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="guided-popover">{children}</div>
  ),
}));

// Mock the feature flag hook
jest.mock("@/lib/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => [false, jest.fn()],
}));

describe("Flashcard", () => {
  const frontContent = "Front of the card";
  const backContent = "Back of the card";
  const context = "This is some context.";
  const onReviewMock = jest.fn();

  beforeEach(() => {
    onReviewMock.mockClear();
  });

  // Test 1: Verify initial state
  it("shows front content and helper text initially, but not back content", () => {
    render(<Flashcard frontContent={frontContent} backContent={backContent} />);

    // Check what's visible
    expect(screen.getByText(frontContent)).toBeVisible();
    expect(screen.getByText("Click card to show answer")).toBeVisible();

    // Check what's not in the document
    expect(screen.queryByText(backContent)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /forgot/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /good/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /easy/i }),
    ).not.toBeInTheDocument();
  });

  // Test 2: Verify state after flipping
  it("reveals back content and review buttons when the card is clicked", () => {
    render(
      <Flashcard
        frontContent={frontContent}
        backContent={backContent}
        context={context}
      />,
    );

    // Click the card itself to flip it
    fireEvent.click(screen.getByText(frontContent));

    // Front content is still visible
    expect(screen.getByText(frontContent)).toBeVisible();

    // "Click card to show answer" text is now hidden
    expect(
      screen.queryByText("Click card to show answer"),
    ).not.toBeInTheDocument();

    // Back content is now visible
    expect(screen.getByText(backContent)).toBeVisible();
    expect(screen.getByText(context)).toBeVisible();

    // Review buttons are visible
    expect(screen.getByRole("button", { name: /forgot/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /good/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /easy/i })).toBeVisible();
  });

  it("does not show review buttons when showGradingButtons is false", () => {
    render(
      <Flashcard
        frontContent={frontContent}
        backContent={backContent}
        showGradingButtons={false}
      />,
    );

    fireEvent.click(screen.getByText(frontContent));

    expect(screen.getByText(backContent)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /forgot/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /good/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /easy/i }),
    ).not.toBeInTheDocument();
  });

  // Test 3: Verify review button functionality
  it.each([
    [0, "Forgot"],
    [3, "Good"],
    [5, "Easy"],
  ])(
    "calls onReview with quality %i when '%s' is clicked",
    (quality, buttonName) => {
      render(
        <Flashcard
          frontContent={frontContent}
          backContent={backContent}
          onReview={onReviewMock}
        />,
      );

      // Click the card to reveal the review buttons
      fireEvent.click(screen.getByText(frontContent));
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(buttonName, "i") }),
      );

      expect(onReviewMock).toHaveBeenCalledWith(quality);
    },
  );

  describe("Flashcard TTS Buttons", () => {
    const translationProps = {
      frontContent: "Hola", // Spanish
      backContent: "Hello", // English
      nativeLanguage: "english",
      targetLanguage: "spanish",
      onReview: jest.fn(),
    };

    const mistakeProps = {
      frontContent: "Yo ser feliz", // Incorrect Spanish
      backContent: "Yo soy feliz", // Correct Spanish
      nativeLanguage: "english",
      targetLanguage: "spanish",
      onReview: jest.fn(),
    };

    it("renders TTS buttons with correct languages for a 'MISTAKE' type card", () => {
      render(<Flashcard {...mistakeProps} type="MISTAKE" />);
      fireEvent.click(screen.getByText(mistakeProps.frontContent));

      const ttsButtons = screen.getAllByTestId("tts-button");
      expect(ttsButtons).toHaveLength(2);

      // Front of card is always target language
      expect(ttsButtons[0]).toHaveAttribute("data-text", mistakeProps.frontContent);
      expect(ttsButtons[0]).toHaveAttribute("data-lang", "es-ES");

      // Back of MISTAKE card is also target language
      expect(ttsButtons[1]).toHaveAttribute("data-text", mistakeProps.backContent);
      expect(ttsButtons[1]).toHaveAttribute("data-lang", "es-ES");
    });

    it("renders TTS buttons with correct languages for a 'TRANSLATION' type card", () => {
      render(<Flashcard {...translationProps} type="TRANSLATION" />);
      fireEvent.click(screen.getByText(translationProps.frontContent));

      const ttsButtons = screen.getAllByTestId("tts-button");
      expect(ttsButtons).toHaveLength(2);

      // Front of card is always target language
      expect(ttsButtons[0]).toHaveAttribute("data-text", translationProps.frontContent);
      expect(ttsButtons[0]).toHaveAttribute("data-lang", "es-ES");

      // Back of TRANSLATION card is native language
      expect(ttsButtons[1]).toHaveAttribute("data-text", translationProps.backContent);
      expect(ttsButtons[1]).toHaveAttribute("data-lang", "en-US");
    });
  });
});