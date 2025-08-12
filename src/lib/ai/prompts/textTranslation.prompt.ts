export const getTextTranslationPrompt = (
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
) => `
      You are an expert language translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}.
      Your response should ONLY contain the translated text, without any additional commentary or formatting.

      Text to translate:
      "${text}"
    `;
