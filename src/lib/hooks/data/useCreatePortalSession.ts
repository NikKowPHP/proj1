import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";

export const useCreatePortalSession = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiClient.billing.createPortalSession,
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Portal Error",
        description: error.message || "Could not open the billing portal.",
      });
    },
  });
};
