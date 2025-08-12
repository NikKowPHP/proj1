import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { logger } from "@/lib/logger";

export const useAutocomplete = () => {
  return useMutation({
    mutationFn: apiClient.ai.autocomplete,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
    onError: (error: any) => {
      if (error.response?.status === 429) {
        // No toast for autocomplete, as it's a passive feature.
        // It should just fail silently.
        logger.warn("Autocomplete rate limit reached.");
      } else {
        // Also fail silently for other errors to not disrupt user flow.
        logger.error("Autocomplete error:", error.message);
      }
    },
  });
};