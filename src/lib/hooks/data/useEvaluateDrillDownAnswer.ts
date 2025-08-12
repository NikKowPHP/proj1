// src/lib/hooks/data/useEvaluateDrillDownAnswer.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import type {
  EvaluateDrillDownAnswerPayload,
  EvaluateDrillDownAnswerResult,
} from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";

export const useEvaluateDrillDownAnswer = () => {
  const { toast } = useToast();
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );

  return useMutation<
    EvaluateDrillDownAnswerResult,
    Error,
    EvaluateDrillDownAnswerPayload
  >({
    mutationFn: (payload) => apiClient.ai.evaluateDrillDownAnswer(payload),
    onSuccess: (data, variables) => {
      analytics.capture("DrillDownAnswerSubmitted", {
        mistakeId: variables.mistakeId,
        isCorrect: data.isCorrect,
        score: data.score,
        taskPrompt: variables.taskPrompt,
        userAnswer: variables.userAnswer,
        expectedAnswer: variables.expectedAnswer,
        feedback: data.feedback,
        correctedAnswer: data.correctedAnswer,
        language: variables.targetLanguage,
      });

      if (data.isCorrect) {
        toast({ title: "Correct!", description: data.feedback });
      } else {
        toast({
          title: "Try Again!",
          description: data.feedback,
          variant: "destructive",
        });
      }

      // Invalidate analytics data to reflect the new attempt
      queryClient.invalidateQueries({
        queryKey: ["practiceAnalytics", authUser?.id, activeTargetLanguage],
      });
    },
    onError: (error: any) => {
      let description;
      if (error.response?.status === 429) {
        description =
          error.response?.data?.error ||
          "You have reached your daily limit for this feature.";
      } else {
        description =
          error.message || "Could not evaluate your answer at this time.";
      }
      toast({
        variant: "destructive",
        title: "Evaluation Failed",
        description,
      });
    },
  });
};