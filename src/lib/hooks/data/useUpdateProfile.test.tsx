
/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import { useUpdateProfile } from "./useUpdateProfile";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useToast } from "@/components/ui/use-toast";

// Mock dependencies
jest.mock("@/lib/services/api-client.service");
jest.mock("@/lib/stores/auth.store");
jest.mock("@/components/ui/use-toast");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
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

describe("useUpdateProfile", () => {
  const mockUser = { id: "user-123" };
  const queryKey = ["userProfile", mockUser.id];
  const initialProfile = {
    id: mockUser.id,
    nativeLanguage: "english",
    writingStyle: "Casual",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: mockUser }),
    );
    mockedUseToast.mockReturnValue({ toast: toastMock });
  });

  it("should optimistically update the user profile cache on mutation", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    queryClient.setQueryData(queryKey, initialProfile);

    (mockedApiClient.profile.update as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    const newProfileData = { writingStyle: "Formal" };

    act(() => {
      result.current.mutate(newProfileData);
    });

    await waitFor(() => {
      const updatedProfile = queryClient.getQueryData<any[]>(queryKey);
      expect(updatedProfile).toEqual({
        ...initialProfile,
        ...newProfileData,
      });
    });
  });

  it("should roll back the cache to the previous state on error", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    queryClient.setQueryData(queryKey, initialProfile);

    const mockError = new Error("Update failed");
    (mockedApiClient.profile.update as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    const newProfileData = { writingStyle: "Formal" };

    act(() => {
      result.current.mutate(newProfileData, {
        onError: () => {}, // prevent unhandled rejection
      });
    });

    // Wait for the mutation to settle
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check that the cache has been rolled back
    const profileAfterError = queryClient.getQueryData(queryKey);
    expect(profileAfterError).toEqual(initialProfile);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });

  it("should show a success toast and invalidate queries on success", async () => {
    const { queryClient, wrapper } = createTestWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    (mockedApiClient.profile.update as jest.Mock).mockResolvedValue({
      id: mockUser.id,
    });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ writingStyle: "Formal" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Profile Saved" }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
  });
});