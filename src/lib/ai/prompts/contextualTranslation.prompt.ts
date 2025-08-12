export const getContextualTranslationPrompt = (
  selectedText: string,
  context: string,
  sourceLanguage: string,
  targetLanguage: string,
  nativeLanguage: string,
) => `
You are an expert language tutor. A user has selected a piece of text within a larger sentence to understand it better. Your task is to translate the selected text and provide a very brief, helpful tip. The user's native language is ${nativeLanguage}.

**CONTEXT:**
*   **Full Sentence/Context:** "${context}"
*   **Selected Text:** "${selectedText}"
*   **Source Language (of the text):** ${sourceLanguage}
*   **Target Language (for translation):** ${targetLanguage}

**YOUR TASK:**
Provide a response as a single raw JSON object with this exact structure:
{
  "translation": "A direct and natural translation of ONLY the 'Selected Text' into ${targetLanguage}.",
  "explanation": "A concise pedagogical tip about grammar, vocabulary, or idiomatic usage related to the 'Selected Text'. This tip MUST be in the user's native language: ${nativeLanguage}. Keep it very short, like a tweet (max 50 tokens)."
}

**EXAMPLE:**
For context "I am going to the store to buy some bread.", selected text "to buy", and native language Spanish:
{
  "translation": "comprar",
  "explanation": "En español, 'to buy' se traduce como el infinitivo 'comprar' después de un verbo de movimiento como 'ir a'."
}

Now, process the provided text. CRITICAL: The 'explanation' MUST be in ${nativeLanguage}.
`;