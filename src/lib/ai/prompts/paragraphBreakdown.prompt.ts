
export const getParagraphBreakdownPrompt = (
  text: string,
  sourceLang: string,
  targetLang: string,
  nativeLanguage: string,
) => `
You are an expert language tutor. Your task is to translate a paragraph from ${sourceLang} to ${targetLang}, and then break it down into smaller, grammatically coherent, and pedagogically useful chunks for creating flashcards. The user's native language is ${nativeLanguage}.

**CONTEXT:**
*   **Source Language:** ${sourceLang}
*   **Target Language:** ${targetLang}
*   **Paragraph to Translate:** "${text}"

**YOUR TASK:**
Provide a response as a single raw JSON object with this exact structure:
{
  "fullTranslation": "The complete, natural translation of the entire paragraph into ${targetLang}.",
  "segments": [
    {
      "source": "The first useful phrase from the original paragraph.",
      "translation": "The direct translation of that phrase.",
      "explanation": "A brief explanation of why this chunk is useful for memorization (e.g., 'A common prepositional phrase', 'A key verb conjugation', 'An idiomatic expression'). This explanation MUST be written in the user's native language: ${nativeLanguage}."
    }
  ]
}

**EXAMPLE:**
For the input "I have chosen a topic that is common and interesting: A description of a holiday in the mountains.", with a native language of Spanish, a good response would be:
{
  "fullTranslation": "Ich habe ein Thema gewählt, das gängig und interessant ist: Eine Beschreibung eines Urlaubs in den Bergen.",
  "segments": [
    { "source": "I have chosen a topic", "translation": "Ich habe ein Thema gewählt", "explanation": "Demuestra el tiempo presente perfecto ('have chosen')." },
    { "source": "that is common and interesting", "translation": "das gängig und interessant ist", "explanation": "Una cláusula relativa útil con adjetivos comunes." },
    { "source": "A description of a holiday", "translation": "Eine Beschreibung eines Urlaubs", "explanation": "Muestra el caso genitivo ('of a holiday')." },
    { "source": "in the mountains", "translation": "in den Bergen", "explanation": "Una frase preposicional común que indica ubicación." }
  ]
}

Now, process the provided paragraph. CRITICAL: All "explanation" fields MUST be in ${nativeLanguage}.
`;