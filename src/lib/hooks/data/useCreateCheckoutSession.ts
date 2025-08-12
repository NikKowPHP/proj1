import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";

export const useCreateCheckoutSession = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: apiClient.billing.createCheckoutSession,
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description:
          error.message || "Could not proceed to checkout. Please try again.",
      });
    },
  });
};
