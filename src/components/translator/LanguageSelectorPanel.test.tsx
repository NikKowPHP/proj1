
/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSelectorPanel } from "./LanguageSelectorPanel";

describe("LanguageSelectorPanel", () => {
  const onSwapMock = jest.fn();
  const onSourceChangeMock = jest.fn();
  const onTargetChangeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onSwap when the swap button is clicked", () => {
    render(
      <LanguageSelectorPanel
        sourceLang="english"
        targetLang="spanish"
        allUserLanguages={["english", "spanish"]}
        onSourceChange={onSourceChangeMock}
        onTargetChange={onTargetChangeMock}
        onSwap={onSwapMock}
      />,
    );

    const swapButton = screen.getByLabelText("Swap languages");
    fireEvent.click(swapButton);

    expect(onSwapMock).toHaveBeenCalledTimes(1);
  });
});
