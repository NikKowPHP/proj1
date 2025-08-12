import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useToast } from "@/components/ui/use-toast";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";

export const useCompleteOnboarding = (options?: {
  onSuccess?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);

  return useMutation({
    mutationFn: apiClient.user.completeOnboarding,
    onSuccess: async () => {
      // Show toast immediately for good UX
      toast({
        title: "Onboarding Complete!",
        description: "Welcome! You're all set to start your journey.",
      });

      // Force a refetch of the user profile and wait for it to complete.
      // This ensures the local cache is updated *before* any navigation or state reset.
      await queryClient.refetchQueries({
        queryKey: ["userProfile", authUser?.id],
      });

      // Now that we know the userProfile data is fresh, reset the onboarding store.
      resetOnboarding();

      // Finally, execute any additional success logic, like navigation.
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not finalize onboarding.",
      });
    },
  });
};