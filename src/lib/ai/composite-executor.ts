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
      logger.info(
        `[CompositeExecutor] Attempting request with provider: ${provider.providerName}, model: ${model}`,
        { userId },
      );
      const result = await requestFn(provider, model);
      logger.info(
        `[CompositeExecutor] Successfully completed request with provider: ${provider.providerName}`,
      );
      return { result, serviceUsed: provider.providerName };
    } catch (error) {
      lastError = error;
      logger.warn(
        `[CompositeExecutor] AI provider ${provider.providerName} with model ${model} failed. Falling back to next provider.`,
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
      );
    }
  }

  logger.error("[CompositeExecutor] All AI providers failed.", {
    lastError:
      lastError instanceof Error ? lastError.message : String(lastError),
    userId,
  });
  throw new Error(
    `All AI providers failed. Last error from ${
      providers[providers.length - 1].provider.providerName
    }: ${lastError?.message}`,
  );
}