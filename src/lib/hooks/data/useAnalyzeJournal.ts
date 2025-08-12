import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export const useAnalyzeJournal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );
  const analytics = useAnalytics();
  return useMutation({
    mutationFn: apiClient.analyze.start,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (analysis, journalId) => {
      queryClient.invalidateQueries({ queryKey: ["journal", journalId] });
      queryClient.invalidateQueries({
        queryKey: ["journals", authUser?.id, activeTargetLanguage],
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics", authUser?.id, activeTargetLanguage],
      });
      queryClient.invalidateQueries({
        queryKey: ["userProfile", authUser?.id],
      });
      toast({
        title: "Analysis Complete",
        description: "Your journal feedback is ready to view.",
      });

      if ((analysis as any).topicMastered) {
        toast({
          title: "🎉 Topic Mastered!",
          description: "You've shown consistent high performance on this topic.",
        });
        analytics.capture("Topic Mastered", { journalId });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description:
          error.message || "We encountered an error analyzing your entry.",
      });
    },
  });
};