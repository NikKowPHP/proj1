interface SentenceEvaluationContext {
  sentence: string;
  concept: string;
  targetLanguage: string;
  nativeLanguage: string;
}

export const getSentenceEvaluationPrompt = (
  context: SentenceEvaluationContext,
) => {
  const { sentence, concept, targetLanguage, nativeLanguage } = context;
  return `
    You are an expert language teacher. A student has written a sentence to practice a specific grammatical or vocabulary concept they previously made a mistake on. Your task is to evaluate if their new sentence is correct.

    **CONTEXT:**
    - **Language being practiced:** ${targetLanguage}
    - **Concept the student is practicing:** "${concept}" (This was the explanation for their previous mistake)
    - **Student's new practice sentence:** "${sentence}"
    - **Student's native language (for feedback):** ${nativeLanguage}

    **YOUR TASK:**
    Evaluate the student's sentence. Be encouraging but clear. Your response MUST be a single raw JSON object with this exact structure:
    {
      "isCorrect": "boolean (true if the sentence is grammatically correct and correctly applies the concept, false otherwise)",
      "feedback": "A very short, one-sentence feedback message explaining your reasoning. This feedback MUST be in the student's native language (${nativeLanguage})."
    }

    **EXAMPLE:**
    If the concept was "The past tense of 'go' is 'went'." and the user wrote "She went to the park.", the response should be:
    {
      "isCorrect": true,
      "feedback": "Perfect! You correctly used 'went' as the past tense of 'go'."
    }

    **EXAMPLE 2:**
    If the concept was "Use 'an' before a vowel sound." and the user wrote "I saw a apple.", the response should be:
    {
      "isCorrect": false,
      "feedback": "Almost! Remember to use 'an' before words that start with a vowel sound, like 'apple'."
    }

    Now, evaluate the student's sentence based on the provided context.
    `;
};