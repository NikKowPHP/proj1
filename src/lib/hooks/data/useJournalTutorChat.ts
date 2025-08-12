import React from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useToast } from "@/components/ui/use-toast";
import type { TutorChatMessage } from "@/lib/types";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface JournalTutorChatPayload {
  journalId: string;
  chatHistory: TutorChatMessage[];
}

export const useJournalTutorChat = () => {
  const { toast } = useToast();
  const analytics = useAnalytics();
  const startTimeRef = React.useRef<number | null>(null);

  return useMutation({
    mutationFn: (payload: JournalTutorChatPayload) => {
      startTimeRef.current = Date.now();
      return apiClient.ai.journalTutorChat(payload);
    },
    onSuccess: (data, variables) => {
      const latencyMs = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;
      analytics.capture("JournalTutor_Response_Received", {
        journalId: variables.journalId,
        latencyMs,
      });
    },
    onError: (error: any, variables) => {
      analytics.capture("JournalTutor_Response_Failed", {
        journalId: variables.journalId,
        error: error.message,
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