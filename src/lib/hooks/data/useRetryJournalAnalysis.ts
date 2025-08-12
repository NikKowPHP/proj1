import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";

export const useRetryJournalAnalysis = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiClient.journal.retryAnalysis,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (analysis, journalId) => {
      queryClient.invalidateQueries({ queryKey: ["journal", journalId] });
      toast({
        title: "Analysis Started",
        description:
          "We are re-analyzing your entry. The page will update shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Retry Failed",
        description: error.message || "Could not start the re-analysis.",
      });
    },
  });
};