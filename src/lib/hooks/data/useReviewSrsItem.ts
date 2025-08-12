import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";

export const useReviewSrsItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );

  return useMutation({
    mutationFn: apiClient.srs.review,

    onMutate: async (reviewedItem: { srsItemId: string; quality: number }) => {
      // The study session only deals with cards that are due.
      const queryKey = [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: false },
      ];

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousStudyDeck = queryClient.getQueryData<any[]>(queryKey);

      // Optimistically remove the reviewed card from the UI.
      queryClient.setQueryData<any[]>(queryKey, (old) =>
        old ? old.filter((item) => item.id !== reviewedItem.srsItemId) : [],
      );

      // Return a context object with the snapshotted value
      return { previousStudyDeck };
    },

    onError: (error: any, variables, context: any) => {
      const queryKey = [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: false },
      ];
      if (context?.previousStudyDeck) {
        queryClient.setQueryData(queryKey, context.previousStudyDeck);
      }

      let description;
      if (error.response?.status === 429) {
        description =
          error.response?.data?.error ||
          "You've reached your daily review limit.";
      } else {
        description =
          error.message ||
          "Could not save your review. Your session may be out of sync.";
      }

      toast({
        variant: "destructive",
        title: "Review Failed",
        description,
      });
    },

    onSettled: () => {
      const queryKey = [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: false },
      ];
      // Invalidate the query to ensure eventual consistency with the server.
      queryClient.invalidateQueries({ queryKey });
    },
  });
};