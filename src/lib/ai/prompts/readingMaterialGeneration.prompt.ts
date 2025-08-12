import type { ReadingLevel } from "@/lib/types";

export const getReadingMaterialGenerationPrompt = (
  targetLanguage: string,
  level: ReadingLevel,
) => {
  const cefrLevelMap = {
    BEGINNER: "A1/A2 (beginner)",
    INTERMEDIATE: "B1/B2 (intermediate)",
    ADVANCED: "C1 (advanced)",
  };
  const cefrLevel = cefrLevelMap[level];

  const lengthMap = {
    BEGINNER: "a single, short paragraph (around 50-70 words).",
    INTERMEDIATE: "two short paragraphs (around 100-150 words total).",
    ADVANCED:
      "three paragraphs (around 200-250 words total), using more complex sentences.",
  };
  const length = lengthMap[level];

  return `
You are an expert curriculum developer for language learners. Your task is to generate a short, simple story suitable for a user at the ${cefrLevel} level in ${targetLanguage}.

The story should be engaging and use vocabulary appropriate for this level. It should be ${length}.

Your response MUST be a single raw JSON object with this exact structure:
{
  "title": "A short, simple title for the story in ${targetLanguage}.",
  "content": "The full text of the story in ${targetLanguage}."
}

EXAMPLE for targetLanguage "Spanish" and level BEGINNER:
{
  "title": "El Gato y el Sol",
  "content": "Había una vez un gato llamado Leo. A Leo le encantaba el sol. Todas las mañanas, se sentaba en la ventana para sentir el calor. Un día, una nube cubrió el sol. Leo estaba triste. Pero pronto, el sol volvió a brillar y Leo ronroneó felizmente."
}

Now, generate a ${cefrLevel} level story in ${targetLanguage}.
`;
};