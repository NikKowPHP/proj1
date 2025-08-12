import axios, { AxiosResponse } from "axios";
import { withRetry } from "../utils/withRetry";
import { getAllKeys } from "./groq-key-provider";
import { logger } from "../logger";
import type { TextAIProvider, AIModel, GroqModel } from "./types";
import { TutorChatMessage } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqService implements TextAIProvider {
  readonly providerName = "Groq";

  private async executeRequest<T>(
    requestFn: (client: any) => Promise<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T>> {
    const allKeys = getAllKeys();
    if (allKeys.length === 0) {
      throw new Error("No Groq API keys provided.");
    }

    let lastError: any;
    for (const [index, apiKey] of allKeys.entries()) {
      try {
        const client = axios.create({
          baseURL: GROQ_API_URL,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        });
        return await withRetry(() => requestFn(client));
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        if (
          status === 400 || // Added for invalid API key
          status === 429 ||
          status === 401 ||
          status === 403 ||
          (status >= 500 && status <= 599)
        ) {
          logger.warn(`Groq key #${index + 1} failed (status: ${status}). Rotating.`);
          continue;
        }
        // Re-throw a clean error to avoid circular dependency issues in Jest workers
        const errorDetails = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new Error(
          `Groq request failed with status ${status}: ${errorDetails}`,
        );
      }
    }
    const lastStatus = lastError.response?.status;
    const lastErrorDetails = lastError.response?.data
      ? JSON.stringify(lastError.response.data)
      : lastError.message;
    throw new Error(
      `All Groq API keys failed. Last error: ${lastErrorDetails} (Status: ${lastStatus})`,
    );
  }

  async generateJson<T>(
    prompt: string,
    model: AIModel,
  ): Promise<T> {
    const payload = {
      model: model as GroqModel,
      messages: [{ role: "user", content: prompt }],
    };
    const response: AxiosResponse<any> = await this.executeRequest((client) =>
      client.post("", payload),
    );
    const rawContent = response.data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("Invalid response structure from Groq API.");
    }
    return JSON.parse(rawContent) as T;
  }

  async generateText(prompt: string, model: AIModel): Promise<string> {
    const payload = {
      model: model as GroqModel,
      messages: [{ role: "user", content: prompt }],
    };
    const response: AxiosResponse<any> = await this.executeRequest((client) =>
      client.post("", payload),
    );
    const text = response.data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new Error("Invalid text response from Groq API.");
    }
    return text.trim();
  }

  async generateChatCompletion(
    systemPrompt: string,
    messages: TutorChatMessage[],
    model: AIModel,
  ): Promise<string> {
    const payload = {
      model: model as GroqModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    const response: AxiosResponse<any> = await this.executeRequest((client) =>
      client.post("", payload),
    );
    const text = response.data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      throw new Error("Invalid chat response from Groq API.");
    }
    return text.trim();
  }
}