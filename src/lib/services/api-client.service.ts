import axios from "axios";
import type {
  JournalEntryWithRelations,
  OnboardingData,
  ProfileUpdateData,
  EvaluateDrillDownAnswerPayload,
  EvaluateDrillDownAnswerResult,
  EvaluateUserSentencePayload,
  EvaluateUserSentenceResult,
  UserGoals,
  SrsDrillItem,
  ReadingLevel,
  StructuredWritingTasks,
  TutorChatPayload,
  TutorChatMessage,
} from "@/lib/types";

interface AidUsageEvent {
  type:
    | "sentence_starter"
    | "translator_dialog_apply"
    | "translator_dialog_translate"
    | "translation_tooltip_view"
    | "stuck_helper_view";
  details: Record<string, any>;
}

export const apiClient = {
  profile: {
    get: async () => {
      const { data } = await axios.get("/api/user/profile");
      return data;
    },
    update: async (profileData: ProfileUpdateData) => {
      const { data } = await axios.put("/api/user/profile", profileData);
      return data;
    },
  },
  analytics: {
    get: async (params: { targetLanguage: string; predictionHorizon: string }) => {
      const { data } = await axios.get("/api/analytics", { params });
      return data;
    },
  },
  journal: {
    getAll: async (params: { targetLanguage: string }) => {
      const { data } = await axios.get("/api/journal", { params });
      return data;
    },
    getById: async (id: string): Promise<JournalEntryWithRelations> => {
      const { data } = await axios.get<JournalEntryWithRelations>(
        `/api/journal/${id}`,
      );
      return data;
    },
    create: async (payload: {
      content: string;
      topicTitle?: string;
      targetLanguage: string;
      aidsUsage?: AidUsageEvent[];
      mode?: string;
    }) => {
      const { data } = await axios.post("/api/journal", payload);
      return data;
    },
    retryAnalysis: async (id: string) => {
      const { data } = await axios.post(`/api/journal/${id}/retry-analysis`);
      return data;
    },
  },
  analyze: {
    start: async (journalId: string) => {
      const { data } = await axios.post("/api/analyze", { journalId });
      return data;
    },
  },
  srs: {
    getDeck: async (params: { targetLanguage: string, includeAll?: boolean }) => {
      const { data } = await axios.get("/api/srs/deck", { params });
      return data;
    },
    createFromMistake: async (mistakeId: string) => {
      const { data } = await axios.post("/api/srs/create-from-mistake", {
        mistakeId,
      });
      return data;
    },
    review: async (payload: { srsItemId: string; quality: number }) => {
      const { data } = await axios.post("/api/srs/review", payload);
      return data;
    },
    createFromTranslation: async (payload: {
      frontContent: string;
      backContent: string;
      targetLanguage: string;
      explanation?: string;
      type?: string;
      mistakeId?: string;
    }) => {
      const { data } = await axios.post(
        "/api/srs/create-from-translation",
        payload,
      );
      return data;
    },
    getDrill: async (params: { targetLanguage: string }): Promise<SrsDrillItem[]> => {
      const { data } = await axios.get<SrsDrillItem[]>("/api/srs/drill", { params });
      return data;
    },
  },
  user: {
    generateTopics: async (params: { targetLanguage: string }) => {
      const { data } = await axios.get("/api/user/generate-topics", {
        params,
      });
      return data;
    },
    getSuggestedTopics: async (params: { targetLanguage: string }) => {
      const { data } = await axios.get("/api/user/suggested-topics", {
        params,
      });
      return data;
    },
    getPracticeAnalytics: async (params: { targetLanguage: string }) => {
      const { data } = await axios.get("/api/user/practice-analytics", {
        params,
      });
      return data;
    },
    getMistakes: async (params: {
      targetLanguage: string;
      page: number;
      type?: string;
    }) => {
      const { data } = await axios.get("/api/user/mistakes", { params });
      return data;
    },
    delete: async () => {
      const { data } = await axios.delete("/api/user");
      return data;
    },
    onboard: async (onboardingData: OnboardingData) => {
      const { data } = await axios.post("/api/user/onboard", onboardingData);
      return data;
    },
    completeOnboarding: async () => {
      const { data } = await axios.post("/api/user/complete-onboarding");
      return data;
    },
    resetOnboarding: async () => {
      const { data } = await axios.post("/api/user/reset-onboarding");
      return data;
    },
    evaluateSentence: async (
      payload: EvaluateUserSentencePayload,
    ): Promise<EvaluateUserSentenceResult> => {
      const { data } = await axios.post(
        "/api/user/evaluate-sentence",
        payload,
      );
      return data;
    },
    updateGoals: async (payload: UserGoals) => {
      const { data } = await axios.put("/api/user/goals", payload);
      return data;
    },
    getReadingMaterial: async (params: { targetLanguage: string }) => {
      const { data } = await axios.get("/api/reading-material", { params });
      return data;
    },
    getImagePrompt: async (payload: { targetLanguage: string }) => {
      const { data } = await axios.post("/api/image-prompt", payload);
      return data;
    },
  },
  admin: {
    getUsers: async (params: {
      search: string;
      page: number;
      limit: number;
    }) => {
      const { data } = await axios.get("/api/admin/users", { params });
      return data;
    },
    updateSubscription: async (
      userId: string,
      payload: { subscriptionTier: string; subscriptionStatus?: string },
    ) => {
      const { data } = await axios.put(
        `/api/admin/users/${userId}/subscription`,
        payload,
      );
      return data;
    },
    getSettings: async () => {
      const { data } = await axios.get("/api/admin/settings");
      return data;
    },
    updateSetting: async (payload: { key: string; value: any }) => {
      const { data } = await axios.put("/api/admin/settings", payload);
      return data;
    },
  },
  billing: {
    createCheckoutSession: async (priceId: string) => {
      const { data } = await axios.post("/api/billing/checkout", { priceId });
      return data;
    },
    createPortalSession: async () => {
      const { data } = await axios.post("/api/billing/portal");
      return data;
    },
  },
  ai: {
    autocomplete: async (payload: { text: string }) => {
      const { data } = await axios.post("/api/ai/autocomplete", payload);
      return data;
    },
    getStuckSuggestions: async (payload: {
      topic: string;
      currentText: string;
      targetLanguage: string;
    }) => {
      const { data } = await axios.post("/api/ai/stuck-helper", payload);
      return data;
    },
     translate: async (payload: {
      text: string;
      sourceLanguage: string;
      targetLanguage: string;
    }) => {
      const { data } = await axios.post("/api/ai/translate", payload);
      return data;
    },
    contextualTranslate: async (payload: {
      selectedText: string;
      context: string;
      sourceLanguage: string;
      targetLanguage: string;
    }) => {
      const { data } = await axios.post("/api/ai/contextual-translate", payload);
      return data;
    },
    translateAndBreakdown: async (payload: {
      text: string;
      sourceLanguage: string;
      targetLanguage: string;
    }) => {
      const { data } = await axios.post(
        "/api/ai/translate-breakdown",
        payload,
      );
      return data;
    },
    drillDownMistake: async (payload: {
      mistakeId: string;
      originalText: string;
      correctedText: string;
      explanation: string;
      targetLanguage: string;
      existingTasks?: string[];
    }) => {
      const { data } = await axios.post(
        "/api/ai/drill-down-mistake",
        payload,
      );
      return data;
    },
    evaluateDrillDownAnswer: async (
      payload: EvaluateDrillDownAnswerPayload,
    ): Promise<EvaluateDrillDownAnswerResult> => {
      const { data } = await axios.post(
        "/api/ai/evaluate-drill-down",
        payload,
      );
      return data;
    },
    generateReadingTasks: async (payload: {
      content: string;
      targetLanguage: string;
      level: ReadingLevel;
    }): Promise<StructuredWritingTasks> => {
      const { data } = await axios.post("/api/ai/reading-task", payload);
      return data;
    },
    tutorChat: async (
      payload: TutorChatPayload & { userQuestion: string },
    ): Promise<{ response: string }> => {
      const { data } = await axios.post("/api/ai/tutor-chat", payload);
      return data;
    },
    journalTutorChat: async (payload: {
      journalId: string;
      chatHistory: TutorChatMessage[];
    }): Promise<{ response: string }> => {
      const { data } = await axios.post(
        "/api/ai/journal-tutor-chat",
        payload,
      );
      return data;
    },
    dashboardTutorChat: async (payload: {
      targetLanguage: string;
      chatHistory: TutorChatMessage[];
    }): Promise<{ response: string }> => {
      const { data } = await axios.post(
        "/api/ai/dashboard-tutor-chat",
        payload,
      );
      return data;
    },
  },
  tts: {
    synthesize: async (payload: { text: string; lang: string }) => {
      const { data } = await axios.post<{ audioContent: string }>(
        "/api/tts",
        payload,
      );
      return data;
    },
  },
};