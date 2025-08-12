/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { JournalEditor } from "./JournalEditor";
import { useSubmitJournal } from "@/lib/hooks/data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";

// Mock dependencies
jest.mock("@tiptap/react", () => ({
  ...jest.requireActual("@tiptap/react"),
  useEditor: jest.fn(),
  EditorContent: jest.fn(() => <div role="textbox"></div>), // Mock EditorContent
}));
jest.mock("@/lib/hooks/data", () => ({
  ...jest.requireActual("@/lib/hooks/data"), // keep other hooks
  useSubmitJournal: jest.fn(),
  useUserProfile: jest.fn(() => ({ data: { nativeLanguage: "english" } })),
}));
jest.mock("@/lib/hooks/editor", () => ({
  useStuckWriterEffect: jest.fn(() => ({
    stuckSuggestions: null,
    showStuckUI: false,
    setShowStuckUI: jest.fn(),
  })),
  useAutocompleteEffect: jest.fn(() => ({
    suggestion: null,
    setSuggestion: jest.fn(),
  })),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock("@/lib/stores/language.store", () => ({
  useLanguageStore: Object.assign(
    jest.fn().mockReturnValue({ activeTargetLanguage: "spanish" }),
    {
      getState: jest.fn().mockReturnValue({ activeTargetLanguage: "spanish" }),
    },
  ),
}));
// Mock TranslatorDialog to include a button that triggers onApplyTranslation
jest.mock("@/components/TranslatorDialog", () => ({
  TranslatorDialog: ({
    open,
    onApplyTranslation,
  }: {
    open: boolean;
    onApplyTranslation: (text: string) => void;
  }) =>
    open ? (
      <button onClick={() => onApplyTranslation("Translated Text")}>
        Apply Mock Translation
      </button>
    ) : null,
}));
jest.mock("@/components/ui/TranslationTooltip", () => ({
  TranslationTooltip: () => null,
}));
jest.mock("@/lib/hooks/ui/useSelection", () => ({
  useSelection: jest.fn(() => ({ isVisible: false })),
}));
jest.mock("@/lib/hooks/useFeatureFlag", () => ({
  useFeatureFlag: jest.fn(() => [false, jest.fn()]),
}));
jest.mock("@/lib/hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    capture: jest.fn(),
  }),
}));

const mockMutate = jest.fn();
const mockedUseEditor = useEditor as jest.Mock;

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

// A reusable mock editor object
const createMockEditor = () => ({
  getText: jest.fn(),
  commands: {
    clearContent: jest.fn(),
    setContent: jest.fn(),
  },
  chain: () => ({
    focus: () => ({
      insertContent: jest.fn(() => ({
        run: jest.fn(),
      })),
      setContent: jest.fn(() => ({
        run: jest.fn(),
      })),
      toggleBold: jest.fn(() => ({ run: jest.fn() })),
      toggleItalic: jest.fn(() => ({ run: jest.fn() })),
    }),
  }),
  isActive: jest.fn().mockReturnValue(false),
  // Add mock implementations for plugin registration to satisfy BubbleMenu
  registerPlugin: jest.fn(() => {}),
  unregisterPlugin: jest.fn(() => {}),
});

describe("JournalEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSubmitJournal as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it("displays the correct placeholder for a specific onboarding topic", () => {
    const mockEditor = createMockEditor();
    mockedUseEditor.mockReturnValue(mockEditor);

    render(
      <Wrapper>
        <JournalEditor isOnboarding={true} topicTitle="Introduce yourself." />
      </Wrapper>,
    );

    // Check that useEditor was called
    expect(mockedUseEditor).toHaveBeenCalled();

    // Get the configuration object passed to useEditor
    const editorConfig = mockedUseEditor.mock.calls[0][0];

    // Find the placeholder extension in the config
    const placeholderExtension = editorConfig.extensions.find(
      (ext: any) => ext.name === "placeholder",
    );

    // Assert that the placeholder option is correct
    expect(placeholderExtension.options.placeholder).toBe(
      "Write your introduction here...",
    );
  });

  it("shows an error and prevents submission for entries under 50 characters", async () => {
    const mockEditor = createMockEditor();
    mockEditor.getText.mockReturnValue("This is too short."); // Control editor output
    mockedUseEditor.mockReturnValue(mockEditor);

    render(
      <Wrapper>
        <JournalEditor />
      </Wrapper>,
    );

    const submitButton = screen.getByRole("button", {
      name: "Submit for Analysis",
    });
    fireEvent.click(submitButton);

    expect(mockEditor.getText).toHaveBeenCalledTimes(1);
    expect(mockMutate).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        "Please write at least 50 characters before submitting.",
      ),
    ).toBeVisible();
  });

  it("allows submission for entries 50 characters or longer", async () => {
    const mockEditor = createMockEditor();
    const longText =
      "This is a sufficiently long journal entry that should definitely pass the fifty character minimum requirement.";
    mockEditor.getText.mockReturnValue(longText); // Control editor output
    mockedUseEditor.mockReturnValue(mockEditor);

    render(
      <Wrapper>
        <JournalEditor />
      </Wrapper>,
    );

    const submitButton = screen.getByRole("button", {
      name: "Submit for Analysis",
    });
    fireEvent.click(submitButton);

    expect(mockEditor.getText).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        content: longText,
        topicTitle: "Free Write",
        aidsUsage: [],
        mode: "free_write",
      });
    });

    expect(
      screen.queryByText(
        "Please write at least 50 characters before submitting.",
      ),
    ).not.toBeInTheDocument();
  });

  it("tracks aidsUsage when translator text is applied", async () => {
    const mockEditor = createMockEditor();
    mockEditor.getText.mockReturnValue(
      "This is a long sentence to ensure submission is allowed.",
    );
    mockedUseEditor.mockReturnValue(mockEditor);

    render(
      <Wrapper>
        <JournalEditor />
      </Wrapper>,
    );

    // Open the translator dialog
    const openTranslatorButton = screen.getByRole("button", {
      name: /translate/i,
    });
    fireEvent.click(openTranslatorButton);

    // The mock dialog is now open and contains our button
    const applyButton = screen.getByRole("button", {
      name: "Apply Mock Translation",
    });
    fireEvent.click(applyButton);

    // Now submit the journal
    const submitButton = screen.getByRole("button", {
      name: "Submit for Analysis",
    });
    fireEvent.click(submitButton);

    // Assert that the mutate function was called with the correct aidsUsage data
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          aidsUsage: expect.arrayContaining([
            expect.objectContaining({
              type: "translator_dialog_apply",
              details: expect.objectContaining({ text: "Translated Text" }),
            }),
          ]),
        }),
      );
    });
  });
});