import type { JournalTutorContext } from "@/lib/types";

export function formatJournalTutorContextForPrompt(
  context: JournalTutorContext,
): string {
  const { journal, analysis, snapshot } = context;

  const analysisSummary = `
### Current Journal Entry Analysis
- **Topic:** ${journal.title}
- **Overall Score:** ${((analysis.grammarScore + analysis.phrasingScore + analysis.vocabularyScore) / 3).toFixed(0)}/100
- **AI Summary:** ${analysis.overallSummary || "No summary provided."}
- **Mistakes Found (${analysis.mistakes.length}):**
${analysis.mistakes.map((m) => `  - **${m.original}** -> **${m.corrected}**: ${m.explanation}`).join("\n") || "  - None!"}
- **Strengths Found (${analysis.strengths?.length || 0}):**
${analysis.strengths?.map((s) => `  - **${s.text}**: ${s.explanation}`).join("\n") || "  - None identified in this entry."}
`;

  const snapshotSummary = `
### User's Historical Performance Snapshot
- **Recent Performance Trend:** ${snapshot.trend}
- **Overall Average Score (Recent):** ${snapshot.averageScore.toFixed(0)}/100
- **Top Concepts to Practice:**
${snapshot.challengingConcepts.map((c) => `  - ${c.explanation}`).join("\n") || "  - No specific challenging concepts identified recently."}
`;

  return `${analysisSummary.trim()}\n\n${snapshotSummary.trim()}`;
}