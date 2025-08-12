import { getJournalAnalysisPrompt } from "./journalAnalysis.prompt";

describe("getJournalAnalysisPrompt", () => {
  it("should return a non-empty string", () => {
    const prompt = getJournalAnalysisPrompt("Some content", "Spanish", 50, "English");
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should include the journal content, target language, and proficiency in the prompt", () => {
    const journalContent = "Este es mi diario.";
    const targetLanguage = "Spanish";
    const proficiencyScore = 50;
    const prompt = getJournalAnalysisPrompt(
      journalContent,
      targetLanguage,
      proficiencyScore,
      "English",
    );

    expect(prompt).toContain(journalContent);
    expect(prompt).toContain(targetLanguage);
    expect(prompt).toContain(String(proficiencyScore));
    expect(prompt).toContain("intermediate"); // 50 is intermediate
  });

  it("should correctly identify proficiency description", () => {
    const beginnerPrompt = getJournalAnalysisPrompt("a", "English", 20, "English");
    expect(beginnerPrompt).toContain("beginner");

    const intermediatePrompt = getJournalAnalysisPrompt("a", "English", 60, "English");
    expect(intermediatePrompt).toContain("intermediate");

    const advancedPrompt = getJournalAnalysisPrompt("a", "English", 80, "English");
    expect(advancedPrompt).toContain("advanced");
  });

  it("should not include the USER ASSISTANCE CONTEXT section when no aids are used", () => {
    const promptWithoutAids = getJournalAnalysisPrompt(
      "Content",
      "French",
      50,
      "English",
      null,
    );
    const promptWithEmptyAids = getJournalAnalysisPrompt(
      "Content",
      "French",
      50,
      "English",
      [],
    );

    expect(promptWithoutAids).not.toContain("USER ASSISTANCE CONTEXT");
    expect(promptWithEmptyAids).not.toContain("USER ASSISTANCE CONTEXT");
  });

  it("should include the USER ASSISTANCE CONTEXT section with correct data when aids are used", () => {
    const mockAidsUsage = [
      {
        type: "translator_dialog_apply",
        details: {
          text: "Bonjour",
          timestamp: "2023-01-01T12:00:00.000Z",
        },
      },
    ];

    const prompt = getJournalAnalysisPrompt(
      "Content",
      "French",
      50,
      "English",
      mockAidsUsage,
    );

    expect(prompt).toContain("USER ASSISTANCE CONTEXT");
    expect(prompt).toContain(
      "Do NOT directly penalize the user for using these learning tools.",
    );
    expect(prompt).toContain(JSON.stringify(mockAidsUsage, null, 2));
  });
});