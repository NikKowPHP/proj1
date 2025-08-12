import type { ReadingLevel } from "@/lib/types";

export const getReadingTaskGenerationPrompt = (
  content: string,
  targetLanguage: string,
  level: ReadingLevel,
) => {
  const cefrLevelMap = {
    BEGINNER: "A1/A2 (beginner)",
    INTERMEDIATE: "B1/B2 (intermediate)",
    ADVANCED: "C1 (advanced)",
  };
  const cefrLevel = cefrLevelMap[level];

  return `
You are an expert language curriculum developer. Based on the provided text, generate a set of three distinct writing tasks for a language learner in ${targetLanguage} at the ${cefrLevel} level.

**Provided Text:**
"${content}"

**YOUR TASK:**
Generate a response as a single raw JSON object with three specific keys: "summary", "comprehension", and "creative". Each key must contain an object with a "title" and a "prompt".

- **summary**: A task asking the user to summarize the text.
- **comprehension**: A task with exactly 2-3 specific questions about the text's content.
- **creative**: A creative writing prompt that uses the text as a starting point.

All titles and prompts MUST be in ${targetLanguage}.
If the target language is not a major world language or is one you are less familiar with, generate all prompts and questions in English as a safe fallback.

Your response MUST be a single raw JSON object with this exact structure:
{
  "summary": {
    "title": "Your Title for Summary Task in ${targetLanguage}",
    "prompt": "Your Prompt for Summary Task in ${targetLanguage}"
  },
  "comprehension": {
    "title": "Your Title for Comprehension Task in ${targetLanguage}",
    "prompt": "Your 2-3 Comprehension Questions in ${targetLanguage}, combined into a single string."
  },
  "creative": {
    "title": "Your Title for Creative Task in ${targetLanguage}",
    "prompt": "Your Prompt for Creative Task in ${targetLanguage}"
  }
}

**EXAMPLE for a text about a cat and the sun in Spanish:**
{
  "summary": {
    "title": "Resume la historia",
    "prompt": "Escribe un breve resumen de la historia del gato Leo y el sol en tus propias palabras."
  },
  "comprehension": {
    "title": "Preguntas de Comprensión",
    "prompt": "¿Qué le encantaba al gato Leo? ¿Qué pasó que lo puso triste?"
  },
  "creative": {
    "title": "Escritura Creativa",
    "prompt": "Imagina que eres el gato Leo. Escribe sobre tu día desde su perspectiva."
  }
}

Now, generate the tasks for the provided text.
`;
};