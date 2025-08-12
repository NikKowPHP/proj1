/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { useStuckWriterEffect } from "./useStuckWriterEffect";
import { useStuckWriterSuggestions } from "@/lib/hooks/data";
import { useLanguageStore } from "@/lib/stores/language.store";

// Set up fake timers to control setTimeout
jest.useFakeTimers();

// Mock the dependencies
jest.mock("@/lib/hooks/data", () => ({
  // We need to keep other exports from this module, so we use requireActual
  ...jest.requireActual("@/lib/hooks/data"),
  useStuckWriterSuggestions: jest.fn(),
}));
jest.mock("@/lib/stores/language.store");

const mockMutate = jest.fn();
const mockedUseStuckWriterSuggestions = useStuckWriterSuggestions as jest.Mock;
const mockedUseLanguageStore = useLanguageStore as unknown as jest.Mock;

// A simplified mock of the Tiptap editor
const createMockEditor = () => {
  const listeners: { [key: string]: (...args: any[]) => any } = {};
  return {
    on: jest.fn((event: string, callback: (...args: any[]) => any) => {
      listeners[event] = callback;
    }),
    off: jest.fn(),
    getText: jest.fn(() => "Some text has been written."),
    // We'll use this to simulate the 'update' event
    simulateUpdate: () => {
      if (listeners["update"]) {
        listeners["update"]();
      }
    },
  };
};

describe("useStuckWriterEffect", () => {
  let mockEditor: ReturnType<typeof createMockEditor>;
  let mockOnSuggestionsShown: jest.Mock;

  beforeEach(() => {
    // Reset mocks and state before each test
    jest.clearAllMocks();
    mockedUseStuckWriterSuggestions.mockReturnValue({
      mutate: mockMutate,
      isPending: false, // Default to not pending
    });
    mockedUseLanguageStore.mockImplementation((selector) =>
      selector({ activeTargetLanguage: "english" }),
    );
    mockEditor = createMockEditor(); // Create a fresh mock editor for each test
    mockOnSuggestionsShown = jest.fn();
  });

  it("should not call the mutation if the timer has not reached 7 seconds (Test Case 1)", () => {
    renderHook(() =>
      useStuckWriterEffect(
        mockEditor as any,
        "Test Topic",
        mockOnSuggestionsShown,
      ),
    );

    // Simulate user typing
    act(() => {
      mockEditor.simulateUpdate();
    });

    // Advance time by less than the threshold
    act(() => {
      jest.advanceTimersByTime(6999);
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should call the mutation after 7 seconds of inactivity (Test Case 2)", () => {
    renderHook(() =>
      useStuckWriterEffect(
        mockEditor as any,
        "Test Topic",
        mockOnSuggestionsShown,
      ),
    );

    // Simulate user typing
    act(() => {
      mockEditor.simulateUpdate();
    });

    // Advance time by the full threshold
    act(() => {
      jest.advanceTimersByTime(7000);
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      {
        topic: "Test Topic",
        currentText: "Some text has been written.",
        targetLanguage: "english",
      },
      expect.any(Object),
    );
  });

  it("should reset the timer on subsequent editor updates (Test Case 3)", () => {
    renderHook(() =>
      useStuckWriterEffect(
        mockEditor as any,
        "Test Topic",
        mockOnSuggestionsShown,
      ),
    );

    // First update
    act(() => {
      mockEditor.simulateUpdate();
    });

    // Advance time, but not enough to trigger
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockMutate).not.toHaveBeenCalled();

    // Second update, which should reset the timer
    act(() => {
      mockEditor.simulateUpdate();
    });

    // Advance time again, but not enough from the *reset* point
    act(() => {
      jest.advanceTimersByTime(6999);
    });

    // The mutation should still not have been called because the timer was reset
    expect(mockMutate).not.toHaveBeenCalled();

    // Now advance past the threshold from the second update
    act(() => {
      jest.advanceTimersByTime(1); // 6999 + 1 = 7000
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it("should show UI on success and hide it after 2 minutes", () => {
    const { result } = renderHook(() =>
      useStuckWriterEffect(
        mockEditor as any,
        "Test Topic",
        mockOnSuggestionsShown,
      ),
    );

    expect(result.current.showStuckUI).toBe(false);

    // Trigger mutation by advancing the idle timer
    act(() => {
      mockEditor.simulateUpdate();
      jest.advanceTimersByTime(7000);
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);

    // Simulate the mutation's success callback
    act(() => {
      // The second argument to mutate is the options object with callbacks
      const mutationOptions = mockMutate.mock.calls[0][1];
      mutationOptions.onSuccess({ suggestions: ["Keep writing!"] });
    });

    // UI should now be visible
    expect(result.current.showStuckUI).toBe(true);
    expect(mockOnSuggestionsShown).toHaveBeenCalledWith(["Keep writing!"]);

    // Advance time, but not enough to trigger the dismiss timer
    act(() => {
      jest.advanceTimersByTime(119999); // 1 millisecond short of 2 minutes
    });
    expect(result.current.showStuckUI).toBe(true);

    // Advance time past the 2-minute dismiss threshold
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.showStuckUI).toBe(false);
  });
});