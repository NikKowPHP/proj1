import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useToast } from "@/components/ui/use-toast";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { useRouter } from "next/navigation";

const CHECKLIST_DISMISSED_KEY = "onboarding_checklist_dismissed_v1";

export const useResetOnboarding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const resetOnboardingStore = useOnboardingStore(
    (state) => state.resetOnboarding,
  );
  const router = useRouter();

  return useMutation({
    mutationFn: apiClient.user.resetOnboarding,
    onSuccess: async () => {
      // Clear the dismissal flag from local storage
      localStorage.removeItem(CHECKLIST_DISMISSED_KEY);

      // Reset the Zustand store to its initial state
      resetOnboardingStore();

      // Invalidate the user profile to refetch the new `onboardingCompleted: false` status.
      // The StoreInitializer will then automatically pick up the change and determine the correct
      // starting step for the tour.
      await queryClient.invalidateQueries({
        queryKey: ["userProfile", authUser?.id],
      });

      toast({
        title: "Onboarding Tour Restarted",
        description: "You will now see the guided tour again.",
      });

      // Navigate to the dashboard to begin the tour from a consistent starting point.
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description:
          error.message || "Could not restart the onboarding tour.",
      });
    },
  });
};