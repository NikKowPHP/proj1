
/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { useCreateSrsFromMistake } from "./useCreateSrsFromMistake";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useToast } from "@/components/ui/use-toast";

// Mock dependencies
jest.mock("@/lib/services/api-client.service");
jest.mock("@/lib/stores/auth.store");
jest.mock("@/lib/stores/language.store");
jest.mock("@/components/ui/use-toast");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;
const mockedUseToast = useToast as jest.Mock;

const toastMock = jest.fn();

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

describe("useCreateSrsFromMistake", () => {
  const mockUser = { id: "user-123" };
  const mockLanguage = "spanish";
  const queryKey = [
    "studyDeck",
    mockUser.id,
    mockLanguage,
    { includeAll: true },
  ];
  const initialDeck: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: mockUser }),
    );
    mockedUseLanguageStore.mockImplementation((selector) =>
      selector({ activeTargetLanguage: mockLanguage }),
    );
    mockedUseToast.mockReturnValue({ toast: toastMock });
  });

  it("should optimistically add a new card to the study deck cache", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    queryClient.setQueryData(queryKey, initialDeck);

    (mockedApiClient.srs.createFromMistake as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useCreateSrsFromMistake(), { wrapper });
    const newCardData = {
      mistakeId: "mistake-1",
      frontContent: "I goed",
      backContent: "I went",
      context: "Verb tense",
    };

    act(() => {
      result.current.mutate(newCardData);
    });

    await waitFor(() => {
      const updatedDeck = queryClient.getQueryData<any[]>(queryKey);
      expect(updatedDeck).toHaveLength(1);
    });

    const updatedDeck = queryClient.getQueryData<any[]>(queryKey);
    expect(updatedDeck?.[0].frontContent).toBe(newCardData.frontContent);
    expect(updatedDeck?.[0].id).toContain("temp-");
  });

  it("should roll back the cache on error", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    queryClient.setQueryData(queryKey, initialDeck);

    const mockError = new Error("Failed to create card");
    (mockedApiClient.srs.createFromMistake as jest.Mock).mockRejectedValue(
      mockError,
    );

    const { result } = renderHook(() => useCreateSrsFromMistake(), { wrapper });
    const newCardData = {
      mistakeId: "mistake-1",
      frontContent: "I goed",
      backContent: "I went",
      context: "Verb tense",
    };

    act(() => {
      result.current.mutate(newCardData, { onError: () => {} });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const deckAfterError = queryClient.getQueryData<any[]>(queryKey);
    expect(deckAfterError).toEqual(initialDeck);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });
});