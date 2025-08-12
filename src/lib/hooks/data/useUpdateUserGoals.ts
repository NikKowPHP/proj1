import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useToast } from "@/components/ui/use-toast";
import type { UserGoals } from "@/lib/types";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export const useUpdateUserGoals = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const analytics = useAnalytics();

  return useMutation({
    mutationFn: (data: UserGoals) => apiClient.user.updateGoals(data),
    onSuccess: (updatedData, variables) => {
      analytics.capture("Goal Created", {
        weeklyJournals: variables.weeklyJournals,
      });
      toast({
        title: "Goal Saved",
        description: "Your learning goals have been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["userProfile", authUser?.id],
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description:
          error.message || "Could not save your goals. Please try again.",
      });
    },
  });
};