import type { AudioEvaluationContext } from "@/lib/types";

export const getAudioAnswerEvaluationPrompt = (
  context: Omit<AudioEvaluationContext, "audioBuffer" | "mimeType">,
) => {
  const { question, idealAnswerSummary } = context;
  return `
      You are an expert AI interviewer and evaluator. A user has provided an audio recording as their answer to an interview question.
      Your task is to first transcribe the audio and then evaluate the transcription.

      **CONTEXT:**
      *   **Interview Question:** "${question}"
      *   **Ideal Answer Summary (Key points to look for):** "${idealAnswerSummary}"
      *   The user's audio answer is provided as an audio part.

      **YOUR TASK:**
      Provide a structured, constructive evaluation. Your response MUST be a single raw JSON object with this exact structure:
      {
        "transcription": "A highly accurate transcription of the user's spoken answer from the audio file.",
        "score": "A numerical score from 0 to 100 representing the quality of the answer.",
        "feedbackSummary": "A brief, one-sentence summary of the performance. e.g., 'That was a fantastic explanation.' or 'A good start, but some key details were missing.'",
        "evaluation": {
          "accuracy": "Evaluate the technical accuracy. Mention specific points that were correct or incorrect, referencing the ideal answer summary.",
          "depthAndClarity": "Assess how clearly and deeply the candidate explained the concepts. Was it superficial or did it show true understanding?",
          "completeness": "Was the answer complete? Did it address all parts of the question? What was missing?"
        },
        "overallImpression": "A concluding paragraph summarizing the performance and giving an overall impression.",
        "refinedExampleAnswer": "Provide a well-written, complete, and ideal example answer for this question, suitable for documentation or study. You can include markdown and code blocks here if appropriate."
      }

      Now, transcribe the audio and evaluate the candidate's answer based on the provided context.
    `;
};
