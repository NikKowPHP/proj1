import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

export const useSynthesizeSpeech = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiClient.tts.synthesize,
    onError: (error: any) => {
      logger.error("TTS Synthesis failed", { error });
      let message;
      if (error.response?.status === 429) {
        message =
          error.response?.data?.error ||
          "You've reached your daily audio generation limit.";
      } else {
        message =
          error.response?.data ||
          error.message ||
          "Could not generate audio.";
      }
      toast({
        variant: "destructive",
        title: "Audio Failed",
        description: message,
      });
    },
  });
};