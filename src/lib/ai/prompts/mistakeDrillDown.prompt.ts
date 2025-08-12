interface DrillDownContext {
  original: string;
  corrected: string;
  explanation: string;
  targetLanguage: string;
  nativeLanguage: string;
  previousAttempts?: {
    taskPrompt: string;
    userAnswer: string;
    feedback: string;
  }[];
  existingTasks?: string[];
}

export const getMistakeDrillDownPrompt = (context: DrillDownContext) => {
  const {
    original,
    corrected,
    explanation,
    targetLanguage,
    nativeLanguage,
    previousAttempts,
    existingTasks,
  } = context;

  const previousAttemptsContext =
    previousAttempts && previousAttempts.length > 0
      ? `
**USER'S PREVIOUS STRUGGLES:**
The user has previously tried to practice this concept and made the following mistakes. Please generate NEW exercises that are either simpler or approach the concept from a different angle to help them understand. Avoid repeating similar patterns from the failed attempts.

${JSON.stringify(previousAttempts, null, 2)}
`
      : "";

  const existingTasksContext =
    existingTasks && existingTasks.length > 0
      ? `
**EXISTING EXERCISES:**
The user has already seen the following exercises. Generate completely new and different exercises from this list.
${JSON.stringify(existingTasks, null, 2)}
`
      : "";

  return `
You are an expert language teacher creating practice exercises. A student made a specific mistake in ${targetLanguage}. Your task is to generate 3 new, distinct practice sentences that allow the student to practice the concept they got wrong.

**CONTEXT OF THE MISTAKE:**
- **Language:** ${targetLanguage}
- **Student's Original (Incorrect) Text:** "${original}"
- **Corrected Version:** "${corrected}"
- **Explanation of the Mistake (in ${nativeLanguage}):** "${explanation}"
${previousAttemptsContext}
${existingTasksContext}

**YOUR TASK:**
Generate 3 varied practice sentences. Each sentence should:
1. Be a new, different sentence from the original example and from any existing exercises provided.
2. Directly relate to the grammatical rule or vocabulary concept explained.
3. Be presented as a "fill-in-the-blank" or a simple translation task from ${nativeLanguage} to ${targetLanguage}.

Your response MUST be a single raw JSON object with this exact structure:
{
  "practiceSentences": [
    { "type": "translate", "task": "Translate from ${nativeLanguage}: 'A simple sentence to translate.'", "answer": "The correct ${targetLanguage} translation." },
    { "type": "fill-in-the-blank", "task": "Fill in the blank: 'Sentence with a ____.'", "answer": "The missing word." },
    { "type": "translate", "task": "Translate from ${nativeLanguage}: 'Another simple sentence.'", "answer": "Another correct translation." }
  ]
}

**EXAMPLE:**
For a mistake where a user wrote "I am agree" instead of "I agree" in English (target language), a good response would be:
{
  "practiceSentences": [
    { "type": "translate", "task": "Translate from Spanish: 'Ella está de acuerdo contigo.'", "answer": "She agrees with you." },
    { "type": "fill-in-the-blank", "task": "Fill in the blank: 'They ______ with the decision.'", "answer": "agree" },
    { "type": "translate", "task": "Translate from Spanish: '¿Estás de acuerdo?'", "answer": "Do you agree?" }
  ]
}

Now, generate the practice sentences based on the provided mistake context.
`;
};