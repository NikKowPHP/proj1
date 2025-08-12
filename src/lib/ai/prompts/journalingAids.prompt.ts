export const getJournalingAidsPrompt = (context: {
  topic: string;
  targetLanguage: string;
  proficiency: number;
  struggles?: { mistakeId: string; explanation: string }[];
}) => {
  const { topic, targetLanguage, proficiency, struggles } = context;

  const strugglesContext =
    struggles && struggles.length > 0
      ? `
**USER'S PREVIOUS STRUGGLES:**
The user has previously struggled with the following concepts. Try to create aids that help them practice these specific areas if relevant to the topic.
${struggles.map((s) => `- ${s.explanation}`).join("\n")}
`
      : "";

  return `
      You are an expert language learning mentor. A user with a proficiency of ${proficiency}/100 in ${targetLanguage} wants to write a journal entry on the topic: "${topic}".
      ${strugglesContext}
      Your task is to provide helpful, personalized aids to get them started.
      Your response MUST be a single raw JSON object with this exact structure:
      {
        "sentenceStarter": "A simple, engaging sentence to begin the journal entry.",
        "suggestedVocab": ["word1", "word2", "phrase3"]
      }

      The suggested vocabulary should be relevant to the topic and appropriate for their proficiency level. Include 3-5 items. If the user has previous struggles, try to include vocabulary or a sentence starter that helps them practice one of those concepts.

      Example for topic "My favorite season" and proficiency 40/100:
      {
        "sentenceStarter": "When I think about my favorite time of year, I always come back to...",
        "suggestedVocab": ["autumn leaves", "crisp air", "cozy sweater", "to harvest"]
      }

      Now generate the journaling aids for the given context.
    `;
};