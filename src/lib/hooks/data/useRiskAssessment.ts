import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";

export const useRiskAssessment = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (answers: Record<string, string>) =>
      apiClient.assessment.assess({ answers }),
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Assessment Failed",
        description:
          error.response?.data?.error ||
          error.message ||
          "An unknown error occurred.",
      });
    },
  });
};