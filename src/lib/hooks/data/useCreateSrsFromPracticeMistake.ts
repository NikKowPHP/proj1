// src/lib/hooks/data/useCreateSrsFromPracticeMistake.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface CreateSrsFromPracticeMistakeVariables {
  frontContent: string; // e.g., the practice task prompt
  backContent: string; // e.g., the corrected answer from AI
  targetLanguage: string;
  context?: string; // e.g., the AI's feedback on why it was wrong
  mistakeId?: string; // Optional: link to the original mistake
}

export const useCreateSrsFromPracticeMistake = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );
  const analytics = useAnalytics();

  return useMutation({
    mutationFn: (payload: CreateSrsFromPracticeMistakeVariables) =>
      apiClient.srs.createFromTranslation({
        // Reusing generic SRS creation endpoint
        frontContent: payload.frontContent,
        backContent: payload.backContent,
        targetLanguage: payload.targetLanguage,
        explanation: payload.context,
        type: "PRACTICE_MISTAKE", // Explicitly set the type for filtering/logging
        mistakeId: payload.mistakeId,
      }),
    onMutate: (newSrsItemData) => {
      const queryKey = [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: true },
      ];
      queryClient.cancelQueries({ queryKey });
      const previousStudyDeck = queryClient.getQueryData<any[]>(queryKey);

      queryClient.setQueryData<any[]>(queryKey, (old = []) => [
        {
          id: `temp-${Date.now()}`, // Optimistic ID
          frontContent: newSrsItemData.frontContent,
          backContent: newSrsItemData.backContent,
          context: newSrsItemData.context,
          type: "PRACTICE_MISTAKE",
          targetLanguage: newSrsItemData.targetLanguage,
          nextReviewAt: new Date().toISOString(), // Immediately due
          lastReviewedAt: null,
          interval: 1,
          easeFactor: 2.5,
          createdAt: new Date().toISOString(),
          mistakeId: newSrsItemData.mistakeId,
        },
        ...old, // Add to beginning for better visibility
      ]);
      return { previousStudyDeck };
    },
    onError: (err, _, context: any) => {
      const queryKey = [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: true },
      ];
      queryClient.setQueryData(queryKey, context?.previousStudyDeck); // Rollback optimistic update
      toast({
        variant: "destructive",
        title: "Action Failed",
        description:
          (err as Error).message ||
          "Could not add practice item to your study deck.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "studyDeck",
          authUser?.id,
          activeTargetLanguage,
          { includeAll: true },
        ],
      });
    },
    onSuccess: (data) => {
      analytics.capture("SRS Item Added", {
        source: "practice_mistake",
        srsItemId: data.id,
        originalMistakeId: data.mistakeId,
        language: activeTargetLanguage,
      });
      toast({
        title: "Added to Deck",
        description: "This practice item has been added to your study deck.",
      });
    },
  });
};