
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface CreateSrsFromTranslationVariables {
  frontContent: string;
  backContent: string;
  targetLanguage: string;
  explanation?: string;
}

export const useCreateSrsFromTranslation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );
  const analytics = useAnalytics();
  return useMutation({
    mutationFn: apiClient.srs.createFromTranslation,
    onMutate: (newSrsItemData: CreateSrsFromTranslationVariables) => {
      const queryKey = [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: true },
      ];

      queryClient.cancelQueries({ queryKey });

      const previousStudyDeck = queryClient.getQueryData<any[]>(queryKey);

      queryClient.setQueryData<any[]>(queryKey, (old = []) => {
        const optimisticItem = {
          id: `temp-${Date.now()}`,
          frontContent: newSrsItemData.frontContent,
          backContent: newSrsItemData.backContent,
          context: newSrsItemData.explanation,
          type: "TRANSLATION",
          targetLanguage: newSrsItemData.targetLanguage,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          interval: 1,
          easeFactor: 2.5,
          createdAt: new Date().toISOString(),
        };
        return [...old, optimisticItem];
      });

      return { previousStudyDeck };
    },
    onError: (err, newSrsItem, context: any) => {
      const queryKey = [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: true },
      ];
      queryClient.setQueryData(queryKey, context?.previousStudyDeck);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description:
          (err as Error).message || "Could not add item to your study deck.",
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
    onSuccess: () => {
      analytics.capture("SRS Item Added", {
        source: "translation",
        language: activeTargetLanguage,
      });
      toast({
        title: "Added to Deck",
        description: "The translation has been added to your study deck.",
      });
    },
  });
};