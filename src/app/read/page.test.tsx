/** @jest-environment jsdom */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReadPage from "./page";
import {
  useReadingMaterial,
  useUserProfile,
  useGenerateReadingTask,
  useOnboardUser,
} from "@/lib/hooks/data";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useAuthStore } from "@/lib/stores/auth.store";

// Mock dependencies
const mockGenerateTasksMutate = jest.fn();
jest.mock("@/lib/hooks/data", () => ({
  useReadingMaterial: jest.fn(),
  useUserProfile: jest.fn(),
  useGenerateReadingTask: jest.fn(() => ({
    mutate: mockGenerateTasksMutate,
    isPending: false,
    data: null,
  })),
  useOnboardUser: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));
jest.mock("@/lib/stores/onboarding.store");
jest.mock("@/lib/stores/language.store");
jest.mock("@/lib/stores/auth.store");
jest.mock("@/components/ui/GuidedPopover", () => ({
  GuidedPopover: ({
    isOpen,
    children,
    title,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="guided-popover" data-title={title}>
        {children}
      </div>
    ) : (
      <>{children}</>
    ),
}));
// Mock JournalEditor to avoid its complex dependencies
jest.mock("@/components/JournalEditor", () => ({
  JournalEditor: () => <div data-testid="journal-editor" />,
}));

const mockedUseReadingMaterial = useReadingMaterial as jest.Mock;
const mockedUseUserProfile = useUserProfile as jest.Mock;
const mockedUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;
const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("ReadPage Onboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseUserProfile.mockReturnValue({
      data: {
        nativeLanguage: "english",
        onboardingCompleted: true,
        defaultTargetLanguage: "spanish",
      },
      isLoading: false,
    });
    mockedUseLanguageStore.mockReturnValue({ activeTargetLanguage: "spanish" });
    mockedUseAuthStore.mockReturnValue({ user: { id: "test-user" } });
  });

  it("should render GuidedPopover for READ_WRITE_INTRO step", async () => {
    mockedUseOnboardingStore.mockReturnValue({
      step: "READ_WRITE_INTRO",
      isActive: true,
      setStep: jest.fn(),
    });
    mockedUseReadingMaterial.mockReturnValue({
      data: { id: "mat-1", title: "Test", content: "Test content", level: "BEGINNER" },
      isLoading: false,
    });

    mockGenerateTasksMutate.mockImplementation((_payload, options) => {
      options.onSuccess({
        summary: { title: "Write a Summary", prompt: "Summarize this." },
        comprehension: {
          title: "Comprehension",
          prompt: "What was this about?",
        },
        creative: { title: "Creative", prompt: "Write an alternative ending." },
      });
    });

    render(<ReadPage />, { wrapper });

    await waitFor(() => {
      const popover = screen.getByTestId("guided-popover");
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute("data-title", "Write a Summary");
    });
  });
});