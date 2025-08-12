import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import type { ReadingLevel, StructuredWritingTasks } from "@/lib/types";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface ReadingTaskPayload {
  content: string;
  targetLanguage: string;
  level: ReadingLevel;
  materialId: string; // Added for analytics
}

// The hook returns data of this type
type GenerateReadingTaskResult = StructuredWritingTasks;
// The mutation function takes this payload
type MutatePayload = ReadingTaskPayload;

export const useGenerateReadingTask = () => {
  const { toast } = useToast();
  const analytics = useAnalytics();

  return useMutation<GenerateReadingTaskResult, Error, MutatePayload>({
    mutationFn: (payload) => {
      // Exclude materialId from the API call payload
      const { materialId, ...apiPayload } = payload;
      return apiClient.ai.generateReadingTasks(apiPayload);
    },
    // Disable retries in test environment to prevent timeouts, but keep for production resilience.
    retry: process.env.NODE_ENV === "test" ? false : 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onSuccess: (data, variables) => {
      analytics.capture("Reading Task Generation Succeeded", {
        materialId: variables.materialId,
      });
    },
    onError: (error: any, variables) => {
      let description;
      if (error.response?.status === 429) {
        description =
          error.response?.data?.error ||
          "You have reached your daily limit for this feature.";
      } else {
        description =
          error.message ||
          "Could not generate a writing task. You can still write a summary.";
      }

      analytics.capture("Reading Task Generation Failed", {
        materialId: variables.materialId,
        error: error.message,
      });
      toast({
        variant: "destructive",
        title: "Task Generation Failed",
        description,
      });
    },
  });
};