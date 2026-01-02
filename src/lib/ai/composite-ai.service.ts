import { GeminiService } from "./gemini-service";
import { executeWithFallbacks, ProviderConfig } from "./composite-executor";

import { getPreventivePlanExplainerPrompt } from "./prompts/preventivePlanExplainer.prompt";
import { AIModel } from "./types";

// Define model configuration from environment variables
const MODEL_CONFIG = {
  large: {
    GEMINI: process.env.GEMINI_LARGE_MODEL || "gemini-2.0-flash-exp",
  },
  small: {
    GEMINI: process.env.GEMINI_SMALL_MODEL || "gemini-2.0-flash-exp",
  },
};

export class CompositeAIService {
  private providers: {
    gemini: GeminiService;
  };

  constructor() {
    this.providers = {
      gemini: new GeminiService(),
    };
  }

  private getProviderChain(size: "large" | "small"): ProviderConfig[] {
    const modelConfig = MODEL_CONFIG[size];
    return [
      { provider: this.providers.gemini, model: modelConfig.GEMINI as AIModel },
    ];
  }

  async getPlanExplanation(
    healthPayload: any,
    userId?: string,
    locale: string = "en",
  ) {
    const prompt = getPreventivePlanExplainerPrompt(healthPayload, locale);
    const providerChain = this.getProviderChain("large");
    return executeWithFallbacks(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }
}
      