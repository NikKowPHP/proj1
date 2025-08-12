/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PracticeSection } from "./PracticeSection";
import {
  useDrillDownMistake,
  useEvaluateDrillDownAnswer,
  useCreateSrsFromPracticeMistake,
  useStudyDeck,
  useUserProfile,
  useContextualTranslate,
  useCreateSrsFromTranslation,
} from "@/lib/hooks/data";

// Mock hooks
jest.mock("@/lib/hooks/data", () => ({
  useDrillDownMistake: jest.fn(),
  useEvaluateDrillDownAnswer: jest.fn(),
  useCreateSrsFromPracticeMistake: jest.fn(),
  useStudyDeck: jest.fn(),
  useUserProfile: jest.fn(),
  useContextualTranslate: jest.fn(),
  useCreateSrsFromTranslation: jest.fn(), // Added explicit mock
}));
jest.mock("@/lib/stores/language.store", () => ({
  useLanguageStore: () => ({ activeTargetLanguage: "spanish" }),
}));

const mockedUseDrillDownMistake = useDrillDownMistake as jest.Mock;
const mockedUseEvaluateDrillDownAnswer = useEvaluateDrillDownAnswer as jest.Mock;
const mockedUseStudyDeck = useStudyDeck as jest.Mock;
const mockedUseUserProfile = useUserProfile as jest.Mock;
const mockedUseContextualTranslate = useContextualTranslate as jest.Mock;
const mockedUseCreateSrsFromTranslation =
  useCreateSrsFromTranslation as jest.Mock; // Added mock variable

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("PracticeSection", () => {
  const mockMutateDrillDown = jest.fn();
  const mockMutateEvaluate = jest.fn().mockResolvedValue({});

  const defaultProps = {
    originalText: "I goed to the store.",
    correctedText: "I went to the store.",
    explanation: "The past tense of 'go' is 'went'.",
    mistakeId: "mistake-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDrillDownMistake.mockReturnValue({
      mutate: mockMutateDrillDown,
      isPending: false,
      isSuccess: false,
      data: null,
      isError: false,
    });
    mockedUseEvaluateDrillDownAnswer.mockReturnValue({
      mutateAsync: mockMutateEvaluate,
      isPending: false,
    });
    mockedUseStudyDeck.mockReturnValue({ data: [] });
    (useCreateSrsFromPracticeMistake as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isSuccess: false,
    });
    mockedUseUserProfile.mockReturnValue({
      data: { nativeLanguage: "english" },
      isLoading: false,
    });
    mockedUseContextualTranslate.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    // Provide a default mock implementation for useCreateSrsFromTranslation
    mockedUseCreateSrsFromTranslation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isSuccess: false,
      reset: jest.fn(),
    });
  });

  it("calls the drill down mutation on initial render", () => {
    render(<PracticeSection {...defaultProps} />, { wrapper });

    expect(mockMutateDrillDown).toHaveBeenCalledTimes(1);
    expect(mockMutateDrillDown).toHaveBeenCalledWith({
      mistakeId: defaultProps.mistakeId,
      originalText: defaultProps.originalText,
      correctedText: defaultProps.correctedText,
      explanation: defaultProps.explanation,
      targetLanguage: "spanish",
      existingTasks: [],
    });
  });

  it("displays a loading spinner while initially generating exercises", () => {
    // Set mock to return pending state
    mockedUseDrillDownMistake.mockReturnValue({
      mutate: mockMutateDrillDown,
      isPending: true,
      isSuccess: false,
      data: null,
      isError: false,
    });

    render(<PracticeSection {...defaultProps} />, { wrapper });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays practice sentences on successful drill down", async () => {
    const practiceSentences = [
      { type: "translate", task: "Translate: 'He goes'", answer: "Él va" },
      { type: "fill-in-the-blank", task: "She ____.", answer: "goes" },
    ];

    // Simulate the hook has successfully returned data
    mockedUseDrillDownMistake.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isSuccess: true,
      data: { practiceSentences },
    });

    render(<PracticeSection {...defaultProps} />, { wrapper });

    expect(await screen.findByText("Translate: 'He goes'")).toBeInTheDocument();
    const container = screen.getByText(/She/).parentElement;
    expect(container).toHaveTextContent("She [ your answer ]."); // Fixed whitespace
    expect(
      screen.getByRole("button", { name: /Check Answers/i }),
    ).toBeInTheDocument();
  });

  it("calls the evaluate mutation when 'Check Answers' is clicked", async () => {
    const practiceSentences = [
      { type: "translate", task: "Translate: 'A'", answer: "Alpha" },
      { type: "translate", task: "Translate: 'B'", answer: "Beta" },
    ];

    mockedUseDrillDownMistake.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isSuccess: true,
      data: { practiceSentences },
    });
    render(<PracticeSection {...defaultProps} />, { wrapper });

    const textareas = await screen.findAllByPlaceholderText(
      "Type your answer here...",
    );
    fireEvent.change(textareas[0], { target: { value: "User Answer A" } });

    const checkButton = screen.getByRole("button", { name: /Check Answers/i });
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(mockMutateEvaluate).toHaveBeenCalledTimes(1);
    });

    expect(mockMutateEvaluate).toHaveBeenCalledWith({
      mistakeId: defaultProps.mistakeId,
      taskPrompt: "Translate: 'A'",
      expectedAnswer: "Alpha",
      userAnswer: "User Answer A",
      targetLanguage: "spanish",
    });
  });

  describe("Varied Task Rendering", () => {
    const variedSentences = [
      {
        type: "translate",
        task: "Translate: 'Good morning'",
        answer: "Buenos días",
      },
      {
        type: "fill-in-the-blank",
        task: "The opposite of hot is ____.",
        answer: "cold",
      },
      {
        type: "rephrase",
        task: "I am going to the cinema.",
        answer: "I'm heading to the movies.",
      },
    ];

    it("renders 'translate' task correctly", () => {
      mockedUseDrillDownMistake.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        isSuccess: true,
        data: { practiceSentences: [variedSentences[0]] },
      });
      render(<PracticeSection {...defaultProps} />, { wrapper });
      expect(screen.getByText("Translate: 'Good morning'")).toBeInTheDocument();
    });

    it("renders 'fill-in-the-blank' task correctly", () => {
      mockedUseDrillDownMistake.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        isSuccess: true,
        data: { practiceSentences: [variedSentences[1]] },
      });
      render(<PracticeSection {...defaultProps} />, { wrapper });
      const container = screen.getByText(/The opposite of hot is/).parentElement;
      expect(container).toHaveTextContent(
        "The opposite of hot is [ your answer ].",
      );
    });

    it("renders 'rephrase' task correctly", () => {
      mockedUseDrillDownMistake.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        isSuccess: true,
        data: { practiceSentences: [variedSentences[2]] },
      });
      render(<PracticeSection {...defaultProps} />, { wrapper });
      expect(
        screen.getByText("Rephrase the following sentence:"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/"I am going to the cinema."/),
      ).toBeInTheDocument();
    });
  });
});