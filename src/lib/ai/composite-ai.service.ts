import { CerebrasService } from "./cerebras-service";
import { GroqService } from "./groq-service";
import { GeminiService } from "./gemini-service";
import { executeWithFallbacks, ProviderConfig } from "./composite-executor";

import { getMultiRiskAssessmentPrompt } from "./prompts/multiRiskAssessment.prompt";
import type { MultiCalculationResult } from "@/lib/types";
import { AIModel, TextAIProvider } from "./types";
import { TutorChatMessage } from "../types";

// Define model configuration from environment variables
const MODEL_CONFIG = {
  large: {
    CEREBRAS:
      process.env.CEREBRAS_LARGE_MODEL || "qwen-3-235b-a22b-thinking-2507",
    GROQ: process.env.GROQ_LARGE_MODEL || "moonshotai/kimi-k2-instruct",
    GEMINI: process.env.GEMINI_LARGE_MODEL || "gemini-1.5-flash",
  },
  small: {
    CEREBRAS: process.env.CEREBRAS_SMALL_MODEL || "qwen-3-32b",
    GROQ: process.env.GROQ_SMALL_MODEL || "qwen/qwen3-32b",
    GEMINI: process.env.GEMINI_SMALL_MODEL || "gemini-1.5-flash",
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

  async getRiskAssessmentExplanation(
    calculationResult: MultiCalculationResult,
    userId?: string,
    locale: string = "en",
  ) {
    const prompt = getMultiRiskAssessmentPrompt(calculationResult, locale);
    const providerChain = this.getProviderChain("large");
    return executeWithFallbacks(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }
}
