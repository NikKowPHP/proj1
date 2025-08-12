/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageSetupDialog } from "./LanguageSetupDialog";
import { useOnboardUser } from "@/lib/hooks/data";

// Mock the hook
jest.mock("@/lib/hooks/data", () => ({
  ...jest.requireActual("@/lib/hooks/data"),
  useOnboardUser: jest.fn(),
}));

const mockedUseOnboardUser = useOnboardUser as jest.Mock;

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("LanguageSetupDialog", () => {
  const mockMutate = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseOnboardUser.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it("should render and have the save button disabled initially", () => {
    render(<LanguageSetupDialog isOpen={true} onSuccess={mockOnSuccess} />, {
      wrapper,
    });
    expect(
      screen.getByRole("heading", { name: "Welcome to Lexity!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save & Continue" }),
    ).toBeDisabled();
  });

  it("should enable the save button when both languages are selected", async () => {
    render(<LanguageSetupDialog isOpen={true} onSuccess={mockOnSuccess} />, {
      wrapper,
    });

    // Select native language
    fireEvent.click(screen.getByText("Select your native language"));
    await screen.findByText("English");
    fireEvent.click(screen.getByText("English"));

    // Select target language
    fireEvent.click(screen.getByText("Select a language to learn"));
    await screen.findByText("Spanish");
    fireEvent.click(screen.getByText("Spanish"));

    expect(
      screen.getByRole("button", { name: "Save & Continue" }),
    ).toBeEnabled();
  });

  it("should call useOnboardUser with the correct payload on save", async () => {
    render(<LanguageSetupDialog isOpen={true} onSuccess={mockOnSuccess} />, {
      wrapper,
    });

    fireEvent.click(screen.getByText("Select your native language"));
    await screen.findByText("English");
    fireEvent.click(screen.getByText("English"));

    fireEvent.click(screen.getByText("Select a language to learn"));
    await screen.findByText("Spanish");
    fireEvent.click(screen.getByText("Spanish"));

    fireEvent.click(screen.getByRole("button", { name: "Save & Continue" }));

    expect(mockMutate).toHaveBeenCalledWith(
      {
        nativeLanguage: "english",
        targetLanguage: "spanish",
        writingStyle: "Casual",
        writingPurpose: "Personal",
        selfAssessedLevel: "Beginner",
      },
      expect.any(Object),
    );
  });

  it("should call onSuccess when the mutation succeeds", async () => {
    // Redefine mutate to call onSuccess callback
    mockMutate.mockImplementation((_payload, options) => {
      options.onSuccess();
    });

    render(<LanguageSetupDialog isOpen={true} onSuccess={mockOnSuccess} />, {
      wrapper,
    });

    fireEvent.click(screen.getByText("Select your native language"));
    await screen.findByText("English");
    fireEvent.click(screen.getByText("English"));

    fireEvent.click(screen.getByText("Select a language to learn"));
    await screen.findByText("Spanish");
    fireEvent.click(screen.getByText("Spanish"));

    fireEvent.click(screen.getByRole("button", { name: "Save & Continue" }));

    expect(mockMutate).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
});