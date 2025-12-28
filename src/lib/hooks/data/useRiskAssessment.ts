import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { ActionPlan } from "@/lib/types";

export const useRiskAssessment = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      answers: Record<string, string>;
      locale: string;
      units?: "metric" | "imperial";
    }): Promise<ActionPlan> => apiClient.assessment.assess(payload),
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
