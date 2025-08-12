import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";

export const useTranslateAndBreakdown = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: {
      text: string;
      sourceLanguage: string;
      targetLanguage: string;
    }) => apiClient.ai.translateAndBreakdown(payload),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error: any) => {
      let description;
      if (error.response?.status === 429) {
        description =
          error.response?.data?.error ||
          "You've reached your daily translation limit.";
      } else {
        description =
          error.message || "We could not process your translation at this time.";
      }
      toast({
        variant: "destructive",
        title: "Translation Failed",
        description,
      });
    },
  });
};