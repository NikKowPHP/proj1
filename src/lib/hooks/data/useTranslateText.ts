import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";

export const useTranslateText = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiClient.ai.translate,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
    onError: (error: any) => {
      let description;
      if (error.response?.status === 429) {
        description =
          error.response?.data?.error ||
          "You've reached your daily translation limit.";
      } else {
        description =
          error.message || "Could not translate the text. Please try again.";
      }
      toast({
        variant: "destructive",
        title: "Translation Failed",
        description,
      });
    },
  });
};