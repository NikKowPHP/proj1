import axios from "axios";
import type { AssessmentResult } from "@/lib/types";

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
    }): Promise<AssessmentResult> => {
      const { data } = await axios.post<AssessmentResult>(
        "/api/assess",
        payload,
      );
      return data;
    },
  },
  export: {
    email: async (payload: {
      recipientEmail: string;
      assessmentData: AssessmentResult;
    }) => {
      const { data } = await axios.post("/api/export/email", payload);
      return data;
    },
  },
};
