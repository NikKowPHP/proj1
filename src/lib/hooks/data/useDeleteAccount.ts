import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";

export const useDeleteAccount = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiClient.user.delete,
    onSuccess: () => {
      toast({
        title: "Account Deletion Initiated",
        description: "You will be logged out and your account will be deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description:
          error.message || "Please contact support to delete your account.",
      });
    },
  });
};
