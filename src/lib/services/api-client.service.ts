import axios from "axios";
import type { ActionPlan } from "@/lib/types";

export const apiClient = {
  questionnaire: {
    getActive: async (locale: string) => {
      const { data } = await axios.get(`/api/questionnaire?locale=${locale}`);
      return data;
    },
  },
  assessment: {
    assess: async (payload: {
      answers: Record<string, string>;
      locale: string;
    }): Promise<ActionPlan> => {
      const { data } = await axios.post<ActionPlan>(
        "/api/assess",
        payload,
      );
      return data;
    },
  },
  export: {
    email: async (payload: {
      recipientEmail: string;
      assessmentData: ActionPlan;
    }) => {
      const { data } = await axios.post("/api/export/email", payload);
      return data;
    },
  },
};
      