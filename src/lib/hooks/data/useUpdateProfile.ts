
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useToast } from "@/components/ui/use-toast";
import type { ProfileUpdateData } from "@/lib/types";
import { useLanguageStore } from "@/lib/stores/language.store";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authUser = useAuthStore((state) => state.user);
  const setActiveTargetLanguage = useLanguageStore(
    (state) => state.setActiveTargetLanguage,
  );

  return useMutation({
    mutationFn: (data: ProfileUpdateData) => apiClient.profile.update(data),
    onMutate: (newProfileData) => {
      const queryKey = ["userProfile", authUser?.id];
      queryClient.cancelQueries({ queryKey });

      const previousProfile = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const { targetLanguage, ...restOfBody } = newProfileData;
        const updatedData = { ...restOfBody };
        if (targetLanguage) {
          (updatedData as any).defaultTargetLanguage = targetLanguage;
        }

        return { ...old, ...updatedData };
      });

      return { previousProfile };
    },
    onError: (error: Error, variables, context: any) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ["userProfile", authUser?.id],
          context.previousProfile,
        );
      }
      toast({
        variant: "destructive",
        title: "Save Failed",
        description:
          error.message || "Could not save your profile. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", authUser?.id],
      });
    },
    onSuccess: (updatedUser) => {
      // If the default language was changed, update the active language in the store.
      if (updatedUser.defaultTargetLanguage) {
        setActiveTargetLanguage(updatedUser.defaultTargetLanguage);
      }
      toast({
        title: "Profile Saved",
        description: "Your changes have been saved successfully.",
      });
    },
  });
};