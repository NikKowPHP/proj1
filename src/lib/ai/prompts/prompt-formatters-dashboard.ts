import type { DashboardTutorContext } from "@/lib/types";

export function formatDashboardTutorContextForPrompt(
  context: DashboardTutorContext,
): string {
  const { goals, snapshot, recentMistakes, srsStats } = context;

  let goalsSection =
    "### User's Goals\n- The user has not set any specific goals yet.";
  if (goals?.weeklyJournals) {
    goalsSection = `### User's Goals\n- Write at least ${goals.weeklyJournals} journal entries per week.`;
  }

  let snapshotSection =
    "### User's Historical Performance Snapshot\n- The user is new and has no performance data yet. Welcome them!";
  if (snapshot.trend !== "new") {
    snapshotSection = `
### User's Historical Performance Snapshot
- **Recent Performance Trend:** ${snapshot.trend}
- **Overall Average Score (Recent):** ${snapshot.averageScore.toFixed(0)}/100
- **Top Concepts to Practice:**
${snapshot.challengingConcepts.map((c) => `  - ${c.explanation}`).join("\n") || "  - No specific challenging concepts identified recently."}
        `.trim();
  }

  let mistakesSection =
    "### User's 3 Most Recent Mistakes\n- No recent mistakes found. Great job!";
  if (recentMistakes.length > 0) {
    mistakesSection = `
### User's 3 Most Recent Mistakes
${recentMistakes.map((m, i) => `${i + 1}. **"${m.original}"** -> **"${m.corrected}"**\n   - *Explanation:* ${m.explanation}`).join("\n")}
        `.trim();
  }

  const srsSection = `
### Spaced Repetition System (SRS) Stats
- **Cards due today:** ${srsStats.dueToday}
- **Cards due this week:** ${srsStats.dueThisWeek}
- **Total cards in deck:** ${srsStats.total}
    `.trim();

  return [goalsSection, snapshotSection, mistakesSection, srsSection].join(
    "\n\n",
  );
}