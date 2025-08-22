import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import type { ActionPlan } from "@/lib/types";

interface EmailExportPayload {
  recipientEmail: string;
  assessmentData: ActionPlan;
  answers: Record<string, string>;
  locale: string;
}

export const useEmailExport = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: EmailExportPayload) =>
      apiClient.export.email(payload),
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Your health plan has been sent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Email Failed",
        description:
          error.message ||
          "Could not send the email. Please try again or download the PDF.",
      });
    },
  });
};
      