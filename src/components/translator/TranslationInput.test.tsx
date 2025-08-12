
/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TranslationInput } from "./TranslationInput";

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    readText: jest.fn(),
  },
});

describe("TranslationInput", () => {
  const onTextChangeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Paste" button when input is empty and "Discard" when not', () => {
    const { rerender } = render(
      <TranslationInput
        sourceText=""
        onTextChange={onTextChangeMock}
        isLoading={false}
      />,
    );
    expect(screen.getByTitle("Paste from clipboard")).toBeInTheDocument();
    expect(screen.queryByTitle("Discard text")).not.toBeInTheDocument();

    rerender(
      <TranslationInput
        sourceText="some text"
        onTextChange={onTextChangeMock}
        isLoading={false}
      />,
    );
    expect(screen.getByTitle("Discard text")).toBeInTheDocument();
    expect(screen.queryByTitle("Paste from clipboard")).not.toBeInTheDocument();
  });

  it("calls onTextChange with clipboard content on paste", async () => {
    (navigator.clipboard.readText as jest.Mock).mockResolvedValue("pasted text");
    render(
      <TranslationInput
        sourceText=""
        onTextChange={onTextChangeMock}
        isLoading={false}
      />,
    );
    const pasteButton = screen.getByTitle("Paste from clipboard");
    fireEvent.click(pasteButton);
    await waitFor(() => {
      expect(onTextChangeMock).toHaveBeenCalledWith("pasted text");
    });
  });

  it("clears input when discard button is clicked", () => {
    render(
      <TranslationInput
        sourceText="some text"
        onTextChange={onTextChangeMock}
        isLoading={false}
      />,
    );
    const discardButton = screen.getByTitle("Discard text");
    fireEvent.click(discardButton);
    expect(onTextChangeMock).toHaveBeenCalledWith("");
  });
});