/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { SuggestedTopics } from "./SuggestedTopics";
import { Skeleton } from "./ui/skeleton";

// Mock the Link component from next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: any;
  }) => {
    // Pass all props down to the anchor tag, including href for inspection
    return <a {...props}>{children}</a>;
  };
  MockLink.displayName = "MockLink"; // Add display name to fix ESLint error
  return MockLink;
});

// Mock the Skeleton component
jest.mock("./ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

describe("SuggestedTopics", () => {
  it("renders Skeleton components when isLoading is true", () => {
    render(<SuggestedTopics topics={[]} isLoading={true} />);
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders null when topics is an empty array and not loading", () => {
    const { container } = render(
      <SuggestedTopics topics={[]} isLoading={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a list of topic buttons when provided with topics", () => {
    const topics = ["My favorite food", "A recent trip", "My career goals"];
    render(<SuggestedTopics topics={topics} isLoading={false} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(topics.length);

    topics.forEach((topic) => {
      const button = screen.getByText(topic);
      expect(button).toBeInTheDocument();
      // Check for variant. The component uses 'outline' variant.
      // The `button.tsx` cva for outline includes `border bg-transparent`.
      // We can check for a class that is unique to the outline variant.
      expect(button).toHaveClass("border");
      expect(button).not.toHaveClass("bg-primary"); // Default variant class
    });

    // Check that buttons are inside a grid container
    const gridContainer = buttons[0].parentElement?.parentElement; // Button -> Link -> div
    expect(gridContainer).toHaveClass("grid");
  });
});
