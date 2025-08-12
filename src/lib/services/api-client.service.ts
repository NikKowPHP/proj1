import axios from "axios";

export const apiClient = {
  questionnaire: {
    getActive: async () => {
      const { data } = await axios.get("/api/questionnaire");
      return data;
    },
  },
  assessment: {
    assess: async (payload: { answers: Record<string, string> }) => {
      const { data } = await axios.post("/api/assess", payload);
      return data;
    },
  },
};