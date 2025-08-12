/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useEvaluateDrillDownAnswer } from "./useEvaluateDrillDownAnswer";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

// Mock dependencies
jest.mock("@/lib/services/api-client.service");
jest.mock("@/components/ui/use-toast");
jest.mock("@/lib/hooks/useAnalytics");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseToast = useToast as jest.Mock;
const mockedUseAnalytics = useAnalytics as jest.Mock;

const toastMock = jest.fn();
const captureMock = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe("useEvaluateDrillDownAnswer", () => {
  const payload = {
    mistakeId: "m1",
    taskPrompt: "Translate",
    expectedAnswer: "Hello",
    userAnswer: "Hi",
    targetLanguage: "english",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseToast.mockReturnValue({ toast: toastMock });
    mockedUseAnalytics.mockReturnValue({ capture: captureMock });
  });

  it("calls apiClient, analytics, and success toast on successful mutation (correct)", async () => {
    const mockResult = {
      isCorrect: true,
      score: 90,
      feedback: "Almost perfect!",
      correctedAnswer: "Hello",
    };
    (
      mockedApiClient.ai.evaluateDrillDownAnswer as jest.Mock
    ).mockResolvedValue(mockResult);
    const { result } = renderHook(() => useEvaluateDrillDownAnswer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(mockedApiClient.ai.evaluateDrillDownAnswer).toHaveBeenCalledWith(
      payload,
    );
    expect(captureMock).toHaveBeenCalledWith(
      "DrillDownAnswerSubmitted",
      expect.objectContaining({
        mistakeId: payload.mistakeId,
        isCorrect: true,
        score: 90,
      }),
    );
    expect(toastMock).toHaveBeenCalledWith({
      title: "Correct!",
      description: "Almost perfect!",
    });
  });

  it("calls apiClient, analytics, and destructive toast on successful mutation (incorrect)", async () => {
    const mockResult = {
      isCorrect: false,
      score: 20,
      feedback: "Not quite.",
      correctedAnswer: "Hello",
    };
    (
      mockedApiClient.ai.evaluateDrillDownAnswer as jest.Mock
    ).mockResolvedValue(mockResult);
    const { result } = renderHook(() => useEvaluateDrillDownAnswer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(captureMock).toHaveBeenCalledWith(
      "DrillDownAnswerSubmitted",
      expect.objectContaining({ isCorrect: false, score: 20 }),
    );
    expect(toastMock).toHaveBeenCalledWith({
      title: "Try Again!",
      description: "Not quite.",
      variant: "destructive",
    });
  });

  it("calls error toast on failed mutation", async () => {
    const mockError = new Error("API is down");
    (
      mockedApiClient.ai.evaluateDrillDownAnswer as jest.Mock
    ).mockRejectedValue(mockError);
    const { result } = renderHook(() => useEvaluateDrillDownAnswer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      // Suppress console error for unhandled promise rejection
      result.current.mutate(payload, { onError: () => {} });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastMock).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Evaluation Failed",
      description: "API is down",
    });
    expect(captureMock).not.toHaveBeenCalled();
  });
});