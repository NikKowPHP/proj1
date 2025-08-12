import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { useUserProfile } from "./data";

// The profile data will be passed in to determine if the query should run.
export const useAdminUsers = (
  userProfile: { subscriptionTier?: string } | null | undefined,
  page: number,
  searchTerm: string,
) => {
  return useQuery({
    queryKey: ["admin-users", searchTerm, page],
    queryFn: () =>
      apiClient.admin.getUsers({ search: searchTerm, page, limit: 20 }),
    // Only enable this query if the user profile is loaded AND the tier is 'ADMIN'.
    enabled: !!userProfile && userProfile.subscriptionTier === "ADMIN",
  });
};

export const useUpdateUserSubscription = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: { subscriptionTier: string; subscriptionStatus?: string };
    }) => apiClient.admin.updateSubscription(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Subscription Updated",
        description: "The user's subscription has been successfully changed.",
      });
      // Invalidation of the user detail page is handled by router.refresh() in the component
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description:
          error.message || "The user's subscription could not be updated.",
      });
    },
  });
};

export const useAdminSettings = () => {
  const { data: userProfile } = useUserProfile();
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: apiClient.admin.getSettings,
    enabled: !!userProfile && userProfile.subscriptionTier === "ADMIN",
  });
};

export const useUpdateAdminSetting = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      apiClient.admin.updateSetting({ key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Setting Updated",
        description: "The system setting has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "The system setting could not be saved.",
      });
    },
  });
};
