
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export const useGenerateTopics = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );
  const analytics = useAnalytics();
  return useMutation({
    mutationFn: () =>
      apiClient.user.generateTopics({
        targetLanguage: activeTargetLanguage!,
      }),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: () => {
      analytics.capture("Topics Generated", { language: activeTargetLanguage });
      queryClient.invalidateQueries({
        queryKey: ["suggestedTopics", authUser?.id, activeTargetLanguage],
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Suggestion Failed",
        description: error.message || "Could not generate topics at this time.",
      });
    },
  });
};