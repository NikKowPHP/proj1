export const getJournalAnalysisPrompt = (
  journalContent: string,
  targetLanguage: string,
  proficiencyScore: number,
  nativeLanguage: string,
  aidsUsage?: any[] | null,
  mode?: string,
) => {
  const proficiencyDescription =
    proficiencyScore < 30
      ? "beginner"
      : proficiencyScore < 70
        ? "intermediate"
        : "advanced";

  const aidsContextSection =
    aidsUsage && aidsUsage.length > 0
      ? `
      **USER ASSISTANCE CONTEXT:**
      The user received assistance while writing this entry. The following tools were used. Use this information to provide more tailored and encouraging feedback. Do NOT directly penalize the user for using these learning tools. Instead, acknowledge their effort to learn and apply new concepts.
      ${JSON.stringify(aidsUsage, null, 2)}
      `
      : "";

  const modeContextSection =
    mode === "describe_image"
      ? `
      **WRITING MODE CONTEXT:**
      The user was not free-writing. They were describing an image. You MUST evaluate the user's text based on how accurately and descriptively it portrays the provided image. Your feedback should focus on descriptive language, spatial prepositions, and appropriate vocabulary for the visual context.
      `
    : mode
      ? `
      **WRITING MODE CONTEXT:**
      The user was not free-writing. They were performing a specific task: "${mode}". Tailor your feedback to this context. For example, if they were summarizing a text, evaluate how well they captured the main points.
      `
      : "";

  return `
      You are an expert AI language tutor. Your task is to analyze a user's journal entry in ${targetLanguage} and provide structured, helpful feedback. The user's proficiency level is ${proficiencyScore}/100 (${proficiencyDescription}). The user's native language is ${nativeLanguage}.

      **CONTEXT:**
      *   **Journal Entry:** "${journalContent}"
      ${aidsContextSection}
      ${modeContextSection}

      **YOUR TASK:**
      Provide a detailed analysis of the entry. The feedback should be encouraging and tailored to the user's proficiency level. Your response MUST be a single raw JSON object with this exact structure:
      {
        "grammarScore": 90,
        "phrasingScore": 85,
        "vocabularyScore": 95,
        "overallSummary": "A 1-2 sentence, encouraging summary written in the user's native language (${nativeLanguage}) that highlights the key takeaway from this analysis.",
        "feedback": "A concise, encouraging summary paragraph of the overall performance. This summary must be in ${targetLanguage}.",
        "strengths": [
           {
            "type": "grammar" | "phrasing" | "vocabulary",
            "text": "The specific well-used word or phrase from the user's text.",
            "explanation": "A simple explanation of why this was a good choice, suitable for a ${proficiencyDescription} learner. This explanation MUST be written in the user's native language: ${nativeLanguage}."
           }
        ],
        "mistakes": [
          {
            "type": "grammar" | "phrasing" | "vocabulary",
            "original": "The incorrect phrase or sentence from the user's text.",
            "corrected": "The corrected version of the phrase or sentence.",
            "explanation": "A simple explanation of why it was wrong and why the correction is better, suitable for a ${proficiencyDescription} learner. This explanation MUST be written in the user's native language: ${nativeLanguage}."
          }
        ],
        "highlights": [
          {
            "start": "The starting character index of the highlight in the original text.",
            "end": "The ending character index of the highlight in the original text.",
            "type": "grammar" | "phrasing" | "vocabulary"
          }
        ]
      }

      **GUIDELINES:**
      1.  Be lenient for beginners and more critical for advanced learners.
      2.  Identify 2-5 key mistakes. If there are no mistakes, return an empty "mistakes" array and an empty "highlights" array.
      3.  Identify 2-3 key strengths where the user did something well. If there are none, return an empty "strengths" array.
      4.  The "highlights" array must correspond to the "mistakes" found, using character indices from the original journal entry.
      5.  CRITICAL: All "explanation" fields (for both mistakes and strengths) and the "overallSummary" MUST be in ${nativeLanguage}. The "feedback" summary must be in ${targetLanguage}.

      Now, analyze the journal entry.
    `;
};