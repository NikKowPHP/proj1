/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { useSubmitJournal } from "./useSubmitJournal";
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

describe("useSubmitJournal", () => {
  const mockUser = { id: "user-123" };
  const mockLanguage = "spanish";
  const queryKey = ["journals", mockUser.id, mockLanguage];
  const initialJournals: any[] = [];

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

  it("should optimistically add a temporary journal to the cache", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    queryClient.setQueryData(queryKey, initialJournals);

    // Return a promise that never resolves to pause the mutation after onMutate
    (mockedApiClient.journal.create as jest.Mock).mockReturnValue(
      new Promise(() => {}),
    );

    const { result } = renderHook(() => useSubmitJournal(), { wrapper });
    const payload = {
      content: "This is a test journal entry.",
      topicTitle: "Testing",
    };

    act(() => {
      result.current.mutate(payload);
    });

    // Wait for the optimistic update to be applied
    await waitFor(() => {
      const updatedJournals = queryClient.getQueryData<any[]>(queryKey);
      expect(updatedJournals).toHaveLength(1);
    });

    const updatedJournals = queryClient.getQueryData<any[]>(queryKey);
    expect(updatedJournals?.[0].content).toBe(payload.content);
    expect(updatedJournals?.[0].isPending).toBe(true);
    expect(updatedJournals?.[0].id).toContain("temp-");
  });

  it("should replace the temporary journal with the real one on success", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    queryClient.setQueryData(queryKey, initialJournals);

    const serverResponse = {
      id: "real-journal-id-123",
      content: "encrypted-content-from-server",
      createdAt: new Date().toISOString(),
    };
    (mockedApiClient.journal.create as jest.Mock).mockResolvedValue(
      serverResponse,
    );

    const { result } = renderHook(() => useSubmitJournal(), { wrapper });
    const payload = {
      content: "This is a test journal entry.",
      topicTitle: "Testing",
    };

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const finalJournals = queryClient.getQueryData<any[]>(queryKey);
    expect(finalJournals).toHaveLength(1);
    expect(finalJournals?.[0].id).toBe(serverResponse.id);
    expect(finalJournals?.[0].content).toBe(payload.content); // important: remains plaintext
    expect(finalJournals?.[0].isPending).toBe(false);
  });

  it("should roll back the cache on error", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    queryClient.setQueryData(queryKey, initialJournals);

    const mockError = new Error("Failed to save journal");
    (mockedApiClient.journal.create as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSubmitJournal(), { wrapper });
    const payload = {
      content: "This will fail.",
      topicTitle: "Failure Test",
    };

    act(() => {
      result.current.mutate(payload, { onError: () => {} });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const journalsAfterError = queryClient.getQueryData<any[]>(queryKey);
    expect(journalsAfterError).toEqual(initialJournals);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });

  it("should include aidsUsage data when calling the API client", async () => {
    const { wrapper } = createTestWrapper();
    (mockedApiClient.journal.create as jest.Mock).mockResolvedValue({});
    const { result } = renderHook(() => useSubmitJournal(), { wrapper });

    const payload = {
      content: "This is a test journal entry.",
      topicTitle: "Testing",
      aidsUsage: [
        {
          type: "translator_dialog_apply" as const,
          details: { text: "hola", timestamp: new Date().toISOString() },
        },
      ],
    };

    act(() => {
      result.current.mutate(payload);
    });

    await waitFor(() => {
      expect(mockedApiClient.journal.create).toHaveBeenCalledWith({
        ...payload,
        targetLanguage: mockLanguage,
      });
    });
  });
});