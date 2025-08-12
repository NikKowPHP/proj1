import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { useLanguageStore } from "@/lib/stores/language.store";

export const useGenerateImagePrompt = () => {
  const { toast } = useToast();
  const { activeTargetLanguage } = useLanguageStore();

  return useMutation({
    mutationFn: () => {
      if (!activeTargetLanguage) {
        throw new Error("No target language selected.");
      }
      return apiClient.user.getImagePrompt({
        targetLanguage: activeTargetLanguage,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Image Prompt Failed",
        description:
          error.message || "Could not generate a new image prompt.",
      });
    },
  });
};