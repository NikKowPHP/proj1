export const getTopicGenerationPrompt = (context: {
  targetLanguage: string;
  proficiency: number;
  count: number;
}) => {
  const { targetLanguage, proficiency, count } = context;
  return `
      You are an expert language learning assistant.
      Generate ${count} interesting and level-appropriate journal topics for a user learning ${targetLanguage}.
      The topics themselves MUST BE in ${targetLanguage}.
      The user's current proficiency level is ${proficiency} out of 100.
      Your response must be a single raw JSON array of strings, without any markdown formatting or surrounding text.

      Example for targetLanguage "Spanish" and count 3:
      [
        "Describe tus vacaciones favoritas y por qué son especiales para ti.",
        "¿Qué habilidad te gustaría aprender y cómo empezarías?",
        "Si pudieras tener un superpoder, ¿cuál sería y por qué?"
      ]

      Now, generate the topics in ${targetLanguage}.
    `;
};