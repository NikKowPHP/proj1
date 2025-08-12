import type { Mistake } from "@prisma/client";

/**
 * Displays analyzed journal text with color-coded highlights for different feedback types.
 * @param {object} props - The component props.
 * @param {string} props.content - The original journal text to display.
 * @param {Array} props.highlights - Array of highlight objects containing:
 * @param {number} props.highlights[].start - Highlight start index in content.
 * @param {number} props.highlights[].end - Highlight end index in content.
 * @param {'grammar'|'phrasing'|'vocabulary'} props.highlights[].type - The type of feedback for styling.
 * @param {Array} props.mistakes - Array of mistake objects from the database, including their IDs and decrypted text.
 * @returns {React.ReactElement} The analysis display component with highlighted feedback.
 */
interface AnalysisDisplayProps {
  content: string;
  highlights: Array<{
    start: number;
    end: number;
    type: "grammar" | "phrasing" | "vocabulary";
  }>;
  mistakes: Mistake[];
}

export function AnalysisDisplay({
  content,
  highlights,
  mistakes,
}: AnalysisDisplayProps) {
  const parts = [];
  let lastIndex = 0;

  // Sort highlights by start index
  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

  sortedHighlights.forEach((highlight, index) => {
    // Add text before the highlight
    if (highlight.start > lastIndex) {
      parts.push(content.slice(lastIndex, highlight.start));
    }

    // Add highlighted text
    const highlightedText = content.slice(highlight.start, highlight.end);
    const bgColor = {
      grammar: "bg-red-300/80 dark:bg-red-700/80",
      phrasing: "bg-blue-300/80 dark:bg-blue-700/80",
      vocabulary: "bg-yellow-300/80 dark:bg-yellow-700/80",
    }[highlight.type];

    // Find the corresponding mistake to get its ID for linking
    // Note: This relies on the decrypted `originalText` from the DB mistake
    // matching the substring from the original content.
    const mistake = mistakes.find((m) => m.originalText === highlightedText);
    const mistakeId = mistake?.id;

    const highlightElement = (
      <span key={`highlight-${index}`} className={`${bgColor} rounded px-1`}>
        {highlightedText}
      </span>
    );

    if (mistakeId) {
      parts.push(
        <a
          key={`link-${index}`}
          href={`#mistake-${mistakeId}`}
          className="cursor-pointer"
        >
          {highlightElement}
        </a>,
      );
    } else {
      parts.push(highlightElement);
    }

    lastIndex = highlight.end;
  });

  // Add remaining text after last highlight
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return (
    <div className="p-4 border rounded-lg bg-background">
      <h2 className="text-lg font-semibold mb-4">Your Original Text</h2>
      <div className="prose max-w-none">{parts}</div>
    </div>
  );
}