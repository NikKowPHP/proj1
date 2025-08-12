import { formatJournalTutorContextForPrompt } from "./prompt-formatters";
import type { JournalTutorContext } from "@/lib/types";

describe("formatJournalTutorContextForPrompt", () => {
  const mockContext: JournalTutorContext = {
    journal: {
      title: "My Vacation",
      content: "I goed to the beach.",
      targetLanguage: "English",
    },
    analysis: {
      grammarScore: 50,
      phrasingScore: 70,
      vocabularyScore: 80,
      overallSummary: "A good start, but watch out for past tense verbs.",
      feedback: "...",
      mistakes: [
        {
          type: "grammar",
          original: "goed",
          corrected: "went",
          explanation: "The past tense of 'go' is 'went'.",
        },
      ],
      strengths: [
        {
          type: "vocabulary",
          text: "beach",
          explanation: "Good use of relevant vocabulary.",
        },
      ],
      highlights: [],
    },
    snapshot: {
      averageScore: 75,
      trend: "improving",
      challengingConcepts: [
        { explanation: "Past tense irregular verbs." },
        { explanation: "Use of articles 'a' vs 'the'." },
      ],
    },
    nativeLanguage: "Spanish",
  };

  it("should format all sections correctly", () => {
    const formatted = formatJournalTutorContextForPrompt(mockContext);

    // Check for main headers
    expect(formatted).toContain("### Current Journal Entry Analysis");
    expect(formatted).toContain("### User's Historical Performance Snapshot");

    // Check for journal details
    expect(formatted).toContain("- **Topic:** My Vacation");
    expect(formatted).toContain("- **Overall Score:** 67/100");
    expect(formatted).toContain("- **AI Summary:** A good start, but watch out for past tense verbs.");

    // Check for mistakes list
    expect(formatted).toContain("- **Mistakes Found (1):**");
    expect(formatted).toContain("- **goed** -> **went**: The past tense of 'go' is 'went'.");

    // Check for strengths list
    expect(formatted).toContain("- **Strengths Found (1):**");
    expect(formatted).toContain("- **beach**: Good use of relevant vocabulary.");

    // Check for snapshot details
    expect(formatted).toContain("- **Recent Performance Trend:** improving");
    expect(formatted).toContain("- **Overall Average Score (Recent):** 75/100");
    expect(formatted).toContain("- **Top Concepts to Practice:**");
    expect(formatted).toContain("- Past tense irregular verbs.");
    expect(formatted).toContain("- Use of articles 'a' vs 'the'.");
  });

  it("should handle empty mistakes and strengths gracefully", () => {
    const contextWithoutIssues: JournalTutorContext = {
      ...mockContext,
      analysis: {
        ...mockContext.analysis,
        mistakes: [],
        strengths: [],
      },
    };
    const formatted = formatJournalTutorContextForPrompt(contextWithoutIssues);

    expect(formatted).toContain("- **Mistakes Found (0):**\n  - None!");
    expect(formatted).toContain("- **Strengths Found (0):**\n  - None identified in this entry.");
  });

  it("should handle empty challenging concepts gracefully", () => {
    const contextWithoutChallenges: JournalTutorContext = {
      ...mockContext,
      snapshot: {
        ...mockContext.snapshot,
        challengingConcepts: [],
      },
    };
    const formatted = formatJournalTutorContextForPrompt(contextWithoutChallenges);
    expect(formatted).toContain("- **Top Concepts to Practice:**\n  - No specific challenging concepts identified recently.");
  });
});