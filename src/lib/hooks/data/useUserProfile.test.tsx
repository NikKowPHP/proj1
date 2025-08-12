/** @jest-environment jsdom */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserProfile } from "./useUserProfile";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import React from "react";

// Mock the API client
jest.mock("@/lib/services/api-client.service");

// Mock the auth store to directly control the `authUser` variable inside the hook
jest.mock("@/lib/stores/auth.store");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

// This factory creates a new QueryClient and wrapper for each test run, ensuring isolation.
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries for tests to get faster results
        retry: false,
      },
    },
  });

  // Using a standard function declaration for the wrapper component
  // to avoid ambiguity between JSX and TypeScript generics in a .ts file.
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return Wrapper;
};

describe("useUserProfile", () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure a clean state
    jest.clearAllMocks();
  });

  it("should not fetch data if there is no authenticated user", () => {
    mockedUseAuthStore.mockImplementation((selector) =>
      selector({ user: null }),
    );

    const { result } = renderHook(() => useUserProfile(), {
      wrapper: createWrapper(),
    });

    // The query is disabled when there's no user, so it should not be in a loading state.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockedApiClient.profile.get).not.toHaveBeenCalled();
  });

  describe("when a user is authenticated", () => {
    const mockUser = { id: "user-123" };

    beforeEach(() => {
      mockedUseAuthStore.mockImplementation((selector) =>
        selector({ user: mockUser }),
      );
    });

    it("should fetch user profile and return data on success (happy path)", async () => {
      const mockProfile = {
        email: "test@example.com",
        nativeLanguage: "English",
        subscriptionTier: "FREE",
      };
      (mockedApiClient.profile.get as jest.Mock).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      // Initially, the hook should be in a loading state because the query is enabled.
      expect(result.current.isLoading).toBe(true);

      // Wait for the asynchronous query to successfully complete.
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert the final state of the hook.
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
      expect(mockedApiClient.profile.get).toHaveBeenCalledTimes(1);
    });

    it("should handle API errors and populate the error state", async () => {
      const mockError = new Error("Failed to fetch profile");
      (mockedApiClient.profile.get as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: createWrapper(),
      });

      // The hook should still be in a loading state initially.
      expect(result.current.isLoading).toBe(true);

      // Wait for the query to result in an error.
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert the final error state.
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
      expect(mockedApiClient.profile.get).toHaveBeenCalledTimes(1);
    });
  });
});
