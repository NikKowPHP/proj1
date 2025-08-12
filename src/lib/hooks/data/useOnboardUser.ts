import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { OnboardingData } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { useLanguageStore } from "@/lib/stores/language.store";

export const useOnboardUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const setActiveTargetLanguage = useLanguageStore(
    (state) => state.setActiveTargetLanguage,
  );

  return useMutation({
    mutationFn: (data: OnboardingData) => apiClient.user.onboard(data),
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", authUser?.id],
      });
      // Explicitly set the active language in the store after successful onboarding
      // using the submitted form data for guaranteed consistency.
      if (variables.targetLanguage) {
        setActiveTargetLanguage(variables.targetLanguage);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "Your profile could not be saved.",
      });
    },
  });
};