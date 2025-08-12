import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import type { TutorChatPayload } from "@/lib/types";

type TutorChatApiPayload = TutorChatPayload & { userQuestion: string };

export const useTutorChat = () => {
  const { toast } = useToast();
  const analytics = useAnalytics();

  return useMutation({
    mutationFn: (payload: TutorChatApiPayload) => apiClient.ai.tutorChat(payload),
    onSuccess: () => {
      // Basic success tracking; more detailed event is in handleSendChatMessage
    },
    onError: (error: any, variables) => {
      analytics.capture("TutorChat_AI_Response_Failed", {
        error: error.message,
        mistakeId: variables.mistakeId,
      });
      toast({
        variant: "destructive",
        title: "AI Tutor Error",
        description:
          error.message || "Could not get a response. Please try again.",
      });
    },
  });
};