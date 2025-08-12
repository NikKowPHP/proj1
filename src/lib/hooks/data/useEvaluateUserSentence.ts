import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import type {
  EvaluateUserSentencePayload,
  EvaluateUserSentenceResult,
} from "@/lib/types";

export const useEvaluateUserSentence = () => {
  const analytics = useAnalytics();

  return useMutation<
    EvaluateUserSentenceResult,
    Error,
    EvaluateUserSentencePayload
  >({
    mutationFn: (payload) => apiClient.user.evaluateSentence(payload),
    onSuccess: (data, variables) => {
      analytics.capture("User Sentence Evaluated", {
        concept: variables.concept,
        isCorrect: data.isCorrect,
        feedback: data.feedback,
        sentence: variables.sentence,
        language: variables.targetLanguage,
      });
    },
    // No generic toast error handling to allow for custom UI feedback in the component
  });
};