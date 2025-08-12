import { CerebrasService } from "./cerebras-service";
import { GroqService } from "./groq-service";
import { GeminiService } from "./gemini-service";
import { executeWithFallbacks, ProviderConfig } from "./composite-executor";
import {
  getContextualTranslationPrompt,
  getJournalAnalysisPrompt,
  getParagraphBreakdownPrompt,
  getReadingMaterialGenerationPrompt,
  getReadingTaskGenerationPrompt,
  getSentenceCompletionPrompt,
  getStuckWriterPrompt,
  getTextTranslationPrompt,
  getTitleGenerationPrompt,
  getTopicGenerationPrompt,
  getDrillDownAnswerEvaluationPrompt,
  getMistakeDrillDownPrompt,
  getSentenceEvaluationPrompt,
  getJournalingAidsPrompt,
  getImageDescriptionGenerationPrompt,
  getTutorChatSystemPrompt,
  getJournalTutorChatSystemPrompt,
  getDashboardTutorChatSystemPrompt,
} from "./prompts";
import type {
  DrillDownContext,
  DrillDownResult,
  EvaluateDrillDownAnswerPayload,
  EvaluateDrillDownAnswerResult,
  EvaluateUserSentencePayload,
  EvaluateUserSentenceResult,
  JournalAnalysisResult,
  ReadingLevel,
  StuckWriterContext,
  StructuredWritingTasks,
  AudioEvaluationContext,
  TutorChatPayload,
  JournalTutorContext,
  DashboardTutorContext,
} from "@/lib/types";
import { AIModel, TextAIProvider, UnifiedEvaluationResult } from "./types";
import { TutorChatMessage } from "../types";

// Define model configuration from environment variables
const MODEL_CONFIG = {
  large: {
    CEREBRAS:
      process.env.CEREBRAS_LARGE_MODEL || "qwen-3-235b-a22b-thinking-2507",
    GROQ: process.env.GROQ_LARGE_MODEL || "moonshotai/kimi-k2-instruct",
    GEMINI: process.env.GEMINI_LARGE_MODEL || "gemini-2.5-flash",
  },
  small: {
    CEREBRAS: process.env.CEREBRAS_SMALL_MODEL || "qwen-3-32b",
    GROQ: process.env.GROQ_SMALL_MODEL || "qwen/qwen3-32b",
    GEMINI: process.env.GEMINI_SMALL_MODEL || "gemini-2.5-flash",
  },
};

export class CompositeAIService {
  private providers: {
    cerebras: CerebrasService;
    groq: GroqService;
    gemini: GeminiService;
  };

  constructor() {
    this.providers = {
      cerebras: new CerebrasService(),
      groq: new GroqService(),
      gemini: new GeminiService(),
    };
  }

  private getProviderChain(size: "large" | "small"): ProviderConfig[] {
    const modelConfig = MODEL_CONFIG[size];
    return [
      {
        provider: this.providers.cerebras,
        model: modelConfig.CEREBRAS as AIModel,
      },
      { provider: this.providers.groq, model: modelConfig.GROQ as AIModel },
      { provider: this.providers.gemini, model: modelConfig.GEMINI as AIModel },
    ];
  }

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    userId?: string,
  ) {
    const prompt = getTextTranslationPrompt(text, sourceLanguage, targetLanguage);
    const providerChain = this.getProviderChain("small");
    const { result, serviceUsed } = await executeWithFallbacks(
      providerChain,
      (provider, model) => provider.generateText(prompt, model),
      userId,
    );
    return { translatedText: result, serviceUsed };
  }

  async contextualTranslate(payload: {
    selectedText: string;
    context: string;
    sourceLanguage: string;
    targetLanguage: string;
    nativeLanguage: string;
    userId?: string;
  }) {
    const prompt = getContextualTranslationPrompt(
      payload.selectedText,
      payload.context,
      payload.sourceLanguage,
      payload.targetLanguage,
      payload.nativeLanguage,
    );
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<{ translation: string; explanation: string }>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      payload.userId,
    );
  }

  async analyzeJournalEntry(
    journalContent: string,
    targetLanguage: string,
    proficiencyScore: number,
    nativeLanguage: string,
    aidsUsage?: any[] | null,
    mode?: string,
    userId?: string,
    imageUrl?: string,
  ): Promise<{ result: JournalAnalysisResult; serviceUsed: string }> {
    const prompt = getJournalAnalysisPrompt(
      journalContent,
      targetLanguage,
      proficiencyScore,
      nativeLanguage,
      aidsUsage,
      mode,
    );

    if (imageUrl) {
      // If an image is present, bypass the fallback chain and go directly to Gemini.
      const result =
        await this.providers.gemini.generateJsonWithImage<JournalAnalysisResult>(
          prompt,
          MODEL_CONFIG.large.GEMINI as AIModel,
          imageUrl,
        );
      return { result, serviceUsed: this.providers.gemini.providerName };
    }

    const providerChain = this.getProviderChain("large");
    return executeWithFallbacks<JournalAnalysisResult>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async getTutorResponse(payload: TutorChatPayload, userId?: string) {
    const systemPrompt = getTutorChatSystemPrompt(payload);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<string>(
      providerChain,
      (provider, model) =>
        provider.generateChatCompletion(
          systemPrompt,
          payload.chatHistory,
          model,
        ),
      userId,
    );
  }

  async getJournalTutorResponse(
    context: JournalTutorContext,
    chatHistory: TutorChatMessage[],
    userId?: string,
  ) {
    const systemPrompt = getJournalTutorChatSystemPrompt(context);
    // This feature exclusively uses Gemini for its large context window and performance.
    const result = await this.providers.gemini.generateChatCompletion(
      systemPrompt,
      chatHistory,
      MODEL_CONFIG.large.GEMINI as AIModel,
    );
    return { result, serviceUsed: this.providers.gemini.providerName };
  }

  async getDashboardTutorResponse(
    context: DashboardTutorContext,
    chatHistory: TutorChatMessage[],
    userId?: string,
  ) {
    const systemPrompt = getDashboardTutorChatSystemPrompt(context);
    const providerChain = this.getProviderChain("large");
    return executeWithFallbacks<string>(
      providerChain,
      (provider, model) =>
        provider.generateChatCompletion(systemPrompt, chatHistory, model),
      userId,
    );
  }

  async evaluateAudioAnswer(context: AudioEvaluationContext): Promise<{
    result: UnifiedEvaluationResult;
    serviceUsed: string;
  }> {
    const result = await this.providers.gemini.evaluateAudioAnswer(context);
    return { result, serviceUsed: this.providers.gemini.providerName };
  }

  async generateImageDescription(userId?: string) {
    const prompt = getImageDescriptionGenerationPrompt();
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<string>(
      providerChain,
      (provider, model) => provider.generateText(prompt, model),
      userId,
    );
  }

  async generateReadingMaterial(
    targetLanguage: string,
    level: ReadingLevel,
    userId?: string,
  ) {
    const prompt = getReadingMaterialGenerationPrompt(targetLanguage, level);
    const providerChain = this.getProviderChain("large");
    return executeWithFallbacks<{ title: string; content: string }>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async generateReadingTasks(
    content: string,
    targetLanguage: string,
    level: ReadingLevel,
    userId?: string,
  ) {
    const prompt = getReadingTaskGenerationPrompt(content, targetLanguage, level);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<StructuredWritingTasks>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async getSentenceCompletion(text: string, userId?: string) {
    const prompt = getSentenceCompletionPrompt(text);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<string>(
      providerChain,
      (provider, model) => provider.generateText(prompt, model),
      userId,
    );
  }

  async generateStuckWriterSuggestions(
    context: StuckWriterContext,
    userId?: string,
  ) {
    const prompt = getStuckWriterPrompt(context);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<{ suggestions: string[] }>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async translateAndBreakdown(
    text: string,
    sourceLang: string,
    targetLang: string,
    nativeLanguage: string,
    userId?: string,
  ) {
    const prompt = getParagraphBreakdownPrompt(
      text,
      sourceLang,
      targetLang,
      nativeLanguage,
    );
    const providerChain = this.getProviderChain("large");
    return executeWithFallbacks<{
      fullTranslation: string;
      segments: { source: string; translation: string; explanation: string }[];
    }>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async generateTopics(
    context: { targetLanguage: string; proficiency: number; count: number },
    userId?: string,
  ) {
    const prompt = getTopicGenerationPrompt(context);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<string[]>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async generateTitleForEntry(journalContent: string, userId?: string) {
    const prompt = getTitleGenerationPrompt(journalContent);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<string>(
      providerChain,
      (provider, model) => provider.generateText(prompt, model),
      userId,
    );
  }

  async generateDrillDownExercises(
    context: DrillDownContext,
    userId?: string,
  ) {
    const prompt = getMistakeDrillDownPrompt(context);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<DrillDownResult>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async evaluateDrillDownAnswer(
    payload: EvaluateDrillDownAnswerPayload & { nativeLanguage: string },
    userId?: string,
  ) {
    const prompt = getDrillDownAnswerEvaluationPrompt(payload);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<EvaluateDrillDownAnswerResult>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async evaluateUserSentence(
    payload: EvaluateUserSentencePayload & { nativeLanguage: string },
    userId?: string,
  ) {
    const prompt = getSentenceEvaluationPrompt(payload);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<EvaluateUserSentenceResult>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }

  async generateJournalingAids(
    context: {
      topic: string;
      targetLanguage: string;
      proficiency: number;
      struggles?: { mistakeId: string; explanation: string }[];
    },
    userId?: string,
  ) {
    const prompt = getJournalingAidsPrompt(context);
    const providerChain = this.getProviderChain("small");
    return executeWithFallbacks<{
      sentenceStarter: string;
      suggestedVocab: string[];
    }>(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }
}