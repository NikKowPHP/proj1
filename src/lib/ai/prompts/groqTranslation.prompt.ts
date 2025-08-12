export const getGroqTranslationSystemPrompt = (
  sourceLanguage: string,
  targetLanguage: string,
): string => `You are an expert, direct language translator. Your task is to translate text from ${sourceLanguage} to ${targetLanguage}.
Respond ONLY with the translated text. Do not include preambles, apologies, or any meta-text like "<think>".`;