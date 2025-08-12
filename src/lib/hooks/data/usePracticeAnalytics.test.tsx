/** @jest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePracticeAnalytics } from "./usePracticeAnalytics";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import React from "react";

// Mock dependencies
jest.mock("@/lib/services/api-client.service");
jest.mock("@/lib/stores/auth.store");
jest.mock("@/lib/stores/language.store");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return Wrapper;
};

describe("usePracticeAnalytics", () => {
  const mockUser = { id: "user-123" };
  const mockLanguage = "spanish";

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: mockUser }),
    );
    mockedUseLanguageStore.mockImplementation((selector) =>
      selector({ activeTargetLanguage: mockLanguage }),
    );
    (mockedApiClient.user.getPracticeAnalytics as jest.Mock).mockResolvedValue({
      data: "practice-analytics-data",
    });
  });

  it("calls apiClient with the correct target language", async () => {
    renderHook(() => usePracticeAnalytics(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockedApiClient.user.getPracticeAnalytics).toHaveBeenCalledWith({
        targetLanguage: mockLanguage,
      });
    });
  });

  it("is disabled if there is no user", () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: null }),
    );
    const { result } = renderHook(() => usePracticeAnalytics(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(true); // From TanStack Query v5, initial state isPending
    expect(result.current.isFetching).toBe(false);
    expect(mockedApiClient.user.getPracticeAnalytics).not.toHaveBeenCalled();
  });

  it("is disabled if there is no active language", () => {
    mockedUseLanguageStore.mockImplementation((selector) =>
      selector({ activeTargetLanguage: null }),
    );
    const { result } = renderHook(() => usePracticeAnalytics(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.isFetching).toBe(false);
    expect(mockedApiClient.user.getPracticeAnalytics).not.toHaveBeenCalled();
  });
});