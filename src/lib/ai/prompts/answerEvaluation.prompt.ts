import type { EvaluationContext } from "@/lib/types";

export const getAnswerEvaluationPrompt = (context: EvaluationContext) => {
  const { question, userAnswer, idealAnswerSummary } = context;
  return `
      You are an expert AI evaluating a candidate's verbal answer to a technical interview question. Your response MUST be a single raw JSON object.

      **CONTEXT:**
      *   **Interview Question:** "${question}"
      *   **Candidate's Answer:** "${userAnswer}"
      *   **Ideal Answer Summary (Key points to look for):** "${idealAnswerSummary}"

      **YOUR TASK:**
      Provide a structured, constructive evaluation of the candidate's answer. The tone should be encouraging but precise. The output must be a single JSON object with this exact structure:
      {
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

      Now, evaluate the candidate's answer based on the provided context.
    `;
};
