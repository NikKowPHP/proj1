/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { TranslationOutput } from "./TranslationOutput";

jest.mock("@/components/ui/TTSButton", () => ({
  TTSButton: ({ text, lang }: { text: string; lang: string }) => (
    <div data-testid="tts-button" data-text={text} data-lang={lang} />
  ),
}));

describe("TranslationOutput", () => {
  it("does not render TTSButton when there is no translated text", () => {
    render(
      <TranslationOutput
        targetLang="spanish"
        translatedText=""
        isBreakingDown={false}
        segments={null}
        studyDeckSet={new Set()}
      />,
    );
    expect(screen.queryByTestId("tts-button")).not.toBeInTheDocument();
  });

  it("renders TTSButton with correct props when there is translated text", () => {
    render(
      <TranslationOutput
        targetLang="spanish"
        translatedText="Hola mundo"
        isBreakingDown={false}
        segments={null}
        studyDeckSet={new Set()}
      />,
    );
    const ttsButton = screen.getByTestId("tts-button");
    expect(ttsButton).toBeInTheDocument();
    expect(ttsButton).toHaveAttribute("data-text", "Hola mundo");
    expect(ttsButton).toHaveAttribute("data-lang", "es-ES");
  });
});