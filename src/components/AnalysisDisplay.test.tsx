/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { AnalysisDisplay } from "./AnalysisDisplay";
import type { Mistake } from "@prisma/client";

describe("AnalysisDisplay", () => {
  const content = "I goed to the store yesterday.";
  const highlights = [{ start: 2, end: 6, type: "grammar" as const }];
  const mistakes = [
    {
      id: "mistake-123",
      originalText: "goed",
      // ... other mistake properties
    },
  ] as Mistake[];

  it("renders the content with highlights", () => {
    render(
      <AnalysisDisplay
        content={content}
        highlights={highlights}
        mistakes={mistakes}
      />,
    );
    // Check that the full content is rendered within the component
    const displayDiv = screen.getByRole("heading", { name: "Your Original Text" })
      .nextElementSibling;
    expect(displayDiv).toHaveTextContent(content);

    // Check for highlighted part specifically
    const highlightedSpan = screen.getByText("goed");
    expect(highlightedSpan).toBeInTheDocument();
    expect(highlightedSpan).toHaveClass("bg-red-300/80");
  });

  it("wraps highlights in an anchor tag with the correct href", () => {
    render(
      <AnalysisDisplay
        content={content}
        highlights={highlights}
        mistakes={mistakes}
      />,
    );
    const linkElement = screen.getByRole("link");
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", "#mistake-mistake-123");
    expect(linkElement).toHaveTextContent("goed");
  });

  it("handles multiple highlights correctly", () => {
    const multiContent = "She buyed a car. It have been a good day.";
    const multiHighlights = [
      { start: 4, end: 9, type: "grammar" as const }, // "buyed"
      { start: 20, end: 24, type: "grammar" as const }, // "have"
    ];
    const multiMistakes = [
      { id: "m1", originalText: "buyed" },
      { id: "m2", originalText: "have" },
    ] as Mistake[];
    render(
      <AnalysisDisplay
        content={multiContent}
        highlights={multiHighlights}
        mistakes={multiMistakes}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "#mistake-m1");
    expect(links[0]).toHaveTextContent("buyed");
    expect(links[1]).toHaveAttribute("href", "#mistake-m2");
    expect(links[1]).toHaveTextContent("have");
  });

  it("renders a highlight as a span if the corresponding mistake is not found", () => {
    // This can happen if AI highlight doesn't perfectly match a mistake's text
    render(
      <AnalysisDisplay
        content={content}
        highlights={highlights}
        mistakes={[{ id: "m1", originalText: "something-else" } as Mistake[]]}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const span = screen.getByText("goed");
    expect(span.tagName).toBe("SPAN");
  });
});