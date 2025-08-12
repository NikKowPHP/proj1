import React from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import type { TutorChatMessage } from "@/lib/types";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface DashboardTutorChatPayload {
  targetLanguage: string;
  chatHistory: TutorChatMessage[];
}

export const useDashboardTutorChat = () => {
  const { toast } = useToast();
  const analytics = useAnalytics();
  const startTimeRef = React.useRef<number | null>(null);

  return useMutation({
    mutationFn: (payload: DashboardTutorChatPayload) => {
      startTimeRef.current = Date.now();
      return apiClient.ai.dashboardTutorChat(payload);
    },
    onSuccess: (data, variables) => {
      const latencyMs = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;
      analytics.capture("DashboardTutor_Response_Received", {
        targetLanguage: variables.targetLanguage,
        latencyMs,
      });
    },
    onError: (error: any, variables) => {
      analytics.capture("DashboardTutor_Response_Failed", {
        targetLanguage: variables.targetLanguage,
        error: error.message,
      });
      toast({
        variant: "destructive",
        title: "AI Coach Error",
        description:
          error.message || "Could not get a response. Please try again.",
      });
    },
  });
};