
/** @jest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAnalyticsData } from "./useAnalyticsData";
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

describe("useAnalyticsData", () => {
  const mockUser = { id: "user-123" };
  const mockLanguage = "spanish";

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthStore.mockImplementation((selector) => selector({ user: mockUser }));
    mockedUseLanguageStore.mockImplementation((selector) => selector({ activeTargetLanguage: mockLanguage }));
    (mockedApiClient.analytics.get as jest.Mock).mockResolvedValue({ data: "analytics-data" });
  });

  it("calls apiClient with the correct predictionHorizon", async () => {
    renderHook(() => useAnalyticsData('1y'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockedApiClient.analytics.get).toHaveBeenCalledWith({
        targetLanguage: mockLanguage,
        predictionHorizon: '1y',
      });
    });
  });

  it("defaults to '3m' predictionHorizon if not provided", async () => {
    renderHook(() => useAnalyticsData(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockedApiClient.analytics.get).toHaveBeenCalledWith({
        targetLanguage: mockLanguage,
        predictionHorizon: '3m',
      });
    });
  });
});