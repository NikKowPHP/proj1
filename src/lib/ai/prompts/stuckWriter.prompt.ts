import type { StuckWriterContext } from "@/lib/types";

export const getStuckWriterPrompt = (context: StuckWriterContext) => {
  const { topic, currentText, targetLanguage } = context;
  return `
      You are a supportive and creative writing coach. A user writing a journal entry in ${targetLanguage} seems to be stuck.
      Their topic is "${topic}" and they have written the following so far: "${currentText}".

      Your task is to generate 2-3 open-ended, thought-provoking questions to help them continue writing. The questions MUST BE in ${targetLanguage} and directly related to their topic and what they've already written.
      
      Your response MUST be a single raw JSON object with this exact structure:
      {
        "suggestions": ["question 1 in ${targetLanguage}", "question 2 in ${targetLanguage}"]
      }

      Example for topic "Mis vacaciones favoritas", text "Fui a la playa.", and targetLanguage "Spanish":
      {
        "suggestions": ["¿Cuál fue el momento más memorable en la playa?", "¿Cómo te hizo sentir el sonido de las olas?", "¿Con quién estabas y qué hicieron juntos?"]
      }

      Now, generate suggestions for the given context in ${targetLanguage}.
    `;
};