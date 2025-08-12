/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGenerateReadingTask } from "./useGenerateReadingTask";
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

describe("useGenerateReadingTask", () => {
  const payload = {
    content: "A story.",
    targetLanguage: "spanish",
    level: "BEGINNER" as const,
    materialId: "mat-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseToast.mockReturnValue({ toast: toastMock });
    mockedUseAnalytics.mockReturnValue({ capture: captureMock });
  });

  it("should call apiClient and analytics on successful mutation", async () => {
    const mockResult = {
      summary: { title: "Resumen", prompt: "..." },
      comprehension: { title: "Comprensión", prompt: "..." },
      creative: { title: "Creativo", prompt: "..." },
    };
    (mockedApiClient.ai.generateReadingTasks as jest.Mock).mockResolvedValue(
      mockResult,
    );
    const { result } = renderHook(() => useGenerateReadingTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    const { materialId, ...apiPayload } = payload;
    expect(mockedApiClient.ai.generateReadingTasks).toHaveBeenCalledWith(
      apiPayload,
    );
    expect(captureMock).toHaveBeenCalledWith(
      "Reading Task Generation Succeeded",
      {
        materialId: payload.materialId,
      },
    );
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("should call analytics and error toast on failed mutation", async () => {
    const mockError = new Error("AI is down");
    (mockedApiClient.ai.generateReadingTasks as jest.Mock).mockRejectedValue(
      mockError,
    );
    const { result } = renderHook(() => useGenerateReadingTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      // Suppress console error for unhandled promise rejection
      result.current.mutate(payload, { onError: () => {} });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastMock).toHaveBeenCalledWith({
      variant: "destructive",
      title: "Task Generation Failed",
      description: "AI is down",
    });
    expect(captureMock).toHaveBeenCalledWith("Reading Task Generation Failed", {
      materialId: payload.materialId,
      error: "AI is down",
    });
  });
});