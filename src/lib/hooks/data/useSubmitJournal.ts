import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

type AidUsageType =
  | "sentence_starter"
  | "translator_dialog_apply"
  | "translator_dialog_translate"
  | "translation_tooltip_view"
  | "stuck_helper_view";

interface AidUsageEvent {
  type: AidUsageType;
  details: any;
}

interface JournalSubmitPayload {
  content: string;
  topicTitle?: string;
  aidsUsage?: AidUsageEvent[];
  mode?: string;
}

export const useSubmitJournal = (options?: {
  onSuccess?: (journal: any) => void;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );
  const analytics = useAnalytics();
  return useMutation({
    mutationFn: (payload: JournalSubmitPayload) =>
      apiClient.journal.create({
        ...payload,
        targetLanguage: activeTargetLanguage!,
      }),
    onMutate: (newJournal) => {
      const queryKey = ["journals", authUser?.id, activeTargetLanguage];
      queryClient.cancelQueries({ queryKey });

      const previousJournals = queryClient.getQueryData(queryKey);

      const optimisticJournal = {
        id: `temp-${Date.now()}`,
        content: newJournal.content,
        createdAt: new Date().toISOString(),
        topic: { title: newJournal.topicTitle || "Free Write" },
        analysis: null,
        isPending: true,
      };

      queryClient.setQueryData(queryKey, (old: any[] = []) => [
        optimisticJournal,
        ...old,
      ]);

      return { previousJournals, optimisticJournalId: optimisticJournal.id };
    },
    onSuccess: (data, variables, context) => {
      analytics.capture("Journal Submitted", {
        journalId: data.id,
        language: activeTargetLanguage,
        characterCount: variables.content.length,
      });

      const journalsQueryKey = ["journals", authUser?.id, activeTargetLanguage];
      queryClient.setQueryData(journalsQueryKey, (old: any[] = []) =>
        old.map((journal) => {
          if (journal.id === context?.optimisticJournalId) {
            return {
              ...journal,
              ...data,
              content: variables.content, // Keep plaintext content
              isPending: false,
              topic: { title: variables.topicTitle || "Free Write" },
            };
          }
          return journal;
        }),
      );

      // Pre-populate the cache for the individual journal entry page
      // to prevent a race condition on navigation.
      const individualJournalQueryKey = ["journal", data.id];
      queryClient.setQueryData(individualJournalQueryKey, {
        ...data,
        content: variables.content,
        analysis: null,
        topic: { title: variables.topicTitle || "Free Write" },
      });

      // Call the component's onSuccess callback
      options?.onSuccess?.(data);
    },
    onError: (error: Error, variables, context: any) => {
      const queryKey = ["journals", authUser?.id, activeTargetLanguage];
      if (context?.previousJournals) {
        queryClient.setQueryData(queryKey, context.previousJournals);
      }
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Your journal entry could not be saved.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["journals", authUser?.id, activeTargetLanguage],
      });
    },
  });
};