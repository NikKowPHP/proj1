export const getTitleGenerationPrompt = (journalContent: string) => `
      You are an expert language tutor helping a student with their journal entry.
      Generate a concise, relevant title (4-6 words) for the following journal entry.
      Your response should ONLY contain the raw text of the title, without any additional commentary or formatting.

      Journal entry content:
      "${journalContent}"
    `;
