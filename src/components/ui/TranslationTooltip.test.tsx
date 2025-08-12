/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TranslationTooltip } from "./TranslationTooltip";
import {
  useContextualTranslate,
  useCreateSrsFromTranslation,
  useStudyDeck,
} from "@/lib/hooks/data";

// Mock hooks
jest.mock("@/lib/hooks/data", () => ({
  useContextualTranslate: jest.fn(),
  useCreateSrsFromTranslation: jest.fn(),
  useStudyDeck: jest.fn(),
}));

const mockedUseContextualTranslate = useContextualTranslate as jest.Mock;
const mockedUseCreateSrsFromTranslation =
  useCreateSrsFromTranslation as jest.Mock;
const mockedUseStudyDeck = useStudyDeck as jest.Mock;

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("TranslationTooltip", () => {
  const mockMutateTranslate = jest.fn();
  const mockMutateAddToDeck = jest.fn();
  const mockOnTranslationSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseContextualTranslate.mockReturnValue({
      mutate: mockMutateTranslate,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: null,
    });
    mockedUseCreateSrsFromTranslation.mockReturnValue({
      mutate: mockMutateAddToDeck,
      isPending: false,
      isSuccess: false,
    });
    mockedUseStudyDeck.mockReturnValue({ data: [] });
  });

  const defaultProps = {
    selectedText: "Hello",
    contextText: "I just wanted to say Hello.",
    sourceLang: "english",
    targetLang: "spanish",
    position: { x: 100, y: 100 },
    onClose: jest.fn(),
    onTranslationSuccess: mockOnTranslationSuccess,
  };

  it("calls the translate mutation on mount with context", () => {
    render(<TranslationTooltip {...defaultProps} />, { wrapper });
    expect(mockMutateTranslate).toHaveBeenCalledWith({
      selectedText: "Hello",
      context: "I just wanted to say Hello.",
      sourceLanguage: "english",
      targetLanguage: "spanish",
    });
  });

  it("shows translated text, explanation, and 'Add to Deck' button on success", () => {
    mockedUseContextualTranslate.mockReturnValue({
      mutate: mockMutateTranslate,
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { translation: "Hola", explanation: "A common greeting." },
    });
    render(<TranslationTooltip {...defaultProps} />, { wrapper });
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("A common greeting.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add to Deck/i }),
    ).toBeInTheDocument();
  });

  it("calls the addToDeck mutation with explanation when 'Add to Deck' is clicked", () => {
    mockedUseContextualTranslate.mockReturnValue({
      mutate: mockMutateTranslate,
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { translation: "Hola", explanation: "A common greeting." },
    });
    render(<TranslationTooltip {...defaultProps} />, { wrapper });
    const addButton = screen.getByRole("button", { name: /Add to Deck/i });
    fireEvent.click(addButton);

    expect(mockMutateAddToDeck).toHaveBeenCalledWith({
      frontContent: "Hello",
      backContent: "Hola",
      targetLanguage: "english", // sourceLang is the user's TARGET language
      explanation: "A common greeting.",
    });
  });
});