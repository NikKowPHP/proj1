import { logger } from "../logger";
import { TextAIProvider, AIModel } from "./types";

export interface ProviderConfig {
  provider: TextAIProvider;
  model: AIModel;
}

export async function executeWithFallbacks<T>(
  providers: ProviderConfig[],
  requestFn: (provider: TextAIProvider, model: AIModel) => Promise<T>,
  userId?: string,
): Promise<{ result: T; serviceUsed: string }> {
  let lastError: any;

  for (const { provider, model } of providers) {
    try {
      const result = await requestFn(provider, model);
      return { result, serviceUsed: provider.providerName };
    } catch (error) {
      lastError = error;
      logger.warn(
        `AI provider ${provider.providerName} with model ${model} failed. Falling back to next provider.`,
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
      );
    }
  }

  throw new Error(
    `All AI providers failed. Last error from ${
      providers[providers.length - 1].provider.providerName
    }: ${lastError?.message}`,
  );
}