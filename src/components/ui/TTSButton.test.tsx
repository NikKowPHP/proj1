
/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TTSButton } from "./TTSButton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSynthesizeSpeech } from "@/lib/hooks/data/useSynthesizeSpeech";

// Mock the TTS hook
jest.mock("@/lib/hooks/data/useSynthesizeSpeech");

const mockedUseSynthesizeSpeech = useSynthesizeSpeech as jest.Mock;

const mockMutate = jest.fn();
const queryClient = new QueryClient();

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

// Mock Audio object
const mockPlay = jest.fn();
const mockPause = jest.fn();
global.Audio = jest.fn().mockImplementation(() => ({
  play: mockPlay,
  pause: mockPause,
  onplay: () => {},
  onended: () => {},
  onerror: () => {},
}));

describe("TTSButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSynthesizeSpeech.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    localStorage.clear();
  });

  it("should render a button that is not disabled", () => {
    renderWithProvider(<TTSButton text="Hello" lang="en-US" />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("should be disabled when the mutation is pending", () => {
    mockedUseSynthesizeSpeech.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });
    renderWithProvider(<TTSButton text="Hello" lang="en-US" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should play from cache if audio is available in localStorage", () => {
    const dataUrl = "data:audio/mpeg;base64,fakesound";
    localStorage.setItem("tts-audio-v2-en-US-Hello", dataUrl);

    renderWithProvider(<TTSButton text="Hello" lang="en-US" />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(global.Audio).toHaveBeenCalledWith(dataUrl);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("should call the mutation if audio is not in cache", () => {
    renderWithProvider(<TTSButton text="Hello" lang="en-US" />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      { text: "Hello", lang: "en-US" },
      expect.any(Object),
    );
  });

  it("should play audio and cache it on successful mutation", () => {
    const base64Content = "fakesound";
    mockMutate.mockImplementation((_vars, options) => {
      options.onSuccess({ audioContent: base64Content });
    });

    renderWithProvider(<TTSButton text="New text" lang="fr-FR" />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const expectedDataUrl = `data:audio/mpeg;base64,${base64Content}`;
    expect(global.Audio).toHaveBeenCalledWith(expectedDataUrl);
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("tts-audio-v2-fr-FR-New text")).toBe(
      expectedDataUrl,
    );
  });
});