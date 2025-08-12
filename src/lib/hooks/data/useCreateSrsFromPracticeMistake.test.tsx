/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCreateSrsFromPracticeMistake } from "./useCreateSrsFromPracticeMistake";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useToast } from "@/components/ui/use-toast";

// Mock dependencies
jest.mock("@/lib/services/api-client.service");
jest.mock("@/lib/stores/auth.store");
jest.mock("@/lib/stores/language.store");
jest.mock("@/components/ui/use-toast");
jest.mock("@/lib/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ capture: jest.fn() }),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;
const mockedUseToast = useToast as jest.Mock;

const toastMock = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
};

describe("useCreateSrsFromPracticeMistake", () => {
  const mockUser = { id: "user-123" };
  const mockLanguage = "spanish";
  const queryKey = [
    "studyDeck",
    mockUser.id,
    mockLanguage,
    { includeAll: true },
  ];
  const initialDeck: any[] = [];
  const payload = {
    frontContent: "Practice Task",
    backContent: "Correct Answer",
    targetLanguage: mockLanguage,
    context: "AI feedback",
    mistakeId: "mistake-1",
  };

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

  it("calls apiClient.srs.createFromTranslation with correct type and mistakeId", async () => {
    (
      mockedApiClient.srs.createFromTranslation as jest.Mock
    ).mockResolvedValue({});
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateSrsFromPracticeMistake(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    // Destructure to remove 'context' and create the expected object shape
    const { context, ...restOfPayload } = payload;
    expect(mockedApiClient.srs.createFromTranslation).toHaveBeenCalledWith({
      ...restOfPayload,
      type: "PRACTICE_MISTAKE",
      explanation: payload.context,
    });
  });

  it("optimistically adds a card with type 'PRACTICE_MISTAKE' to the cache", async () => {
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(queryKey, initialDeck);

    // Mock API to never resolve to inspect optimistic state
    (
      mockedApiClient.srs.createFromTranslation as jest.Mock
    ).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useCreateSrsFromPracticeMistake(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate(payload);
    });

    await waitFor(() => {
      const updatedDeck = queryClient.getQueryData<any[]>(queryKey);
      expect(updatedDeck).toHaveLength(1);
    });

    const updatedDeck = queryClient.getQueryData<any[]>(queryKey);
    expect(updatedDeck?.[0].type).toBe("PRACTICE_MISTAKE");
    expect(updatedDeck?.[0].mistakeId).toBe(payload.mistakeId);
  });
});