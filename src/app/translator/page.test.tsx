/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import TranslatorPage from "./page";
import {
  useTranslateAndBreakdown,
  useTranslateText,
  useCreateSrsFromTranslation,
} from "@/lib/hooks/data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/lib/hooks/data", () => ({
  useUserProfile: jest.fn(() => ({
    data: {
      nativeLanguage: "english",
      defaultTargetLanguage: "spanish",
      languageProfiles: [{ language: "english" }, { language: "spanish" }],
    },
  })),
  useStudyDeck: jest.fn(() => ({ data: [] })),
  useTranslateText: jest.fn(),
  useTranslateAndBreakdown: jest.fn(),
  useSynthesizeSpeech: jest.fn(() => ({ mutate: jest.fn() })),
  useCreateSrsFromTranslation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    isSuccess: false,
  })),
  useOnboardUser: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

const mockTranslateBreakdownMutate = jest.fn();
const mockTranslateBreakdownReset = jest.fn();
const mockTranslateTextMutate = jest.fn();
const mockTranslateTextReset = jest.fn();

const queryClient = new QueryClient();

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("TranslatorPage Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslateAndBreakdown as jest.Mock).mockReturnValue({
      mutate: mockTranslateBreakdownMutate,
      reset: mockTranslateBreakdownReset,
      isPending: false,
      error: null,
    });
    (useTranslateText as jest.Mock).mockReturnValue({
      mutate: mockTranslateTextMutate,
      reset: mockTranslateTextReset,
      isPending: false,
      error: null,
    });
  });

  it("resets mutations when swapping languages", async () => {
    mockTranslateTextMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        translatedText: "Hola",
      });
    });

    renderWithProvider(<TranslatorPage />);

    const textarea = screen.getByPlaceholderText("Enter text to translate...");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    const translateButton = screen.getByRole("button", { name: /translate/i });
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(mockTranslateTextMutate).toHaveBeenCalled();
    });

    // Now swap languages
    const swapButton = screen.getByLabelText("Swap languages");
    fireEvent.click(swapButton);

    // Check that reset was called on the mutations
    expect(mockTranslateBreakdownReset).toHaveBeenCalledTimes(1);
    expect(mockTranslateTextReset).toHaveBeenCalledTimes(1);
  });

  it("should show fast translation first, then breakdown segments", async () => {
    renderWithProvider(<TranslatorPage />);

    // 1. Simulate user input and click
    const textarea = screen.getByPlaceholderText("Enter text to translate...");
    fireEvent.change(textarea, {
      target: { value: "Good morning. How are you?" },
    });
    const translateButton = screen.getByRole("button", { name: /translate/i });
    fireEvent.click(translateButton);

    // 2. Verify both mutations were called
    expect(mockTranslateTextMutate).toHaveBeenCalledTimes(1);
    expect(mockTranslateBreakdownMutate).toHaveBeenCalledTimes(1);

    // 3. Simulate fast translation hook resolving
    const fastTranslationPayload = mockTranslateTextMutate.mock.calls[0][1];
    act(() => {
      fastTranslationPayload.onSuccess({
        translatedText: "Buenos días. ¿Cómo estás?",
      });
    });

    // 4. Assert fast translation is visible and breakdown is not
    const outputTextarea = screen.getByPlaceholderText(
      "Translation will appear here...",
    );
    await waitFor(() => {
      expect(outputTextarea).toHaveValue("Buenos días. ¿Cómo estás?");
    });
    expect(
      screen.getByText(
        "Translate a paragraph to see sentence-by-sentence breakdowns here.",
      ),
    ).toBeInTheDocument();

    // 5. Simulate breakdown hook resolving
    const breakdownPayload = mockTranslateBreakdownMutate.mock.calls[0][1];
    act(() => {
      breakdownPayload.onSuccess({
        fullTranslation: "Buenos días. ¿Cómo estás?", // This can be ignored as the UI is already updated
        segments: [
          {
            source: "Good morning.",
            translation: "Buenos días.",
            explanation: "A common greeting.",
          },
          {
            source: "How are you?",
            translation: "¿Cómo estás?",
            explanation: "A common question.",
          },
        ],
      });
    });

    // 6. Assert that breakdown segments are now visible
    await waitFor(() => {
      expect(screen.getByText("Good morning.")).toBeInTheDocument();
    });
    expect(screen.getByText("Tip: A common greeting.")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
    expect(screen.getByText("Tip: A common question.")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Translate a paragraph to see sentence-by-sentence breakdowns here.",
      ),
    ).not.toBeInTheDocument();
  });
});