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
        
        const shouldRotate =
          !status || // Network error
          status === 429 || // Rate limit
          status === 401 || // Auth error
          status === 403 || // Forbidden
          status === 400 || // Bad request (often invalid key)
          (status >= 500 && status <= 599); // Server error

        if (shouldRotate) {
          logger.warn(`Groq key #${index + 1} failed (status: ${status || 'N/A'}). Rotating.`);
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

    // Robust JSON extraction: Find the last complete JSON object in the response.
    const lastBrace = rawContent.lastIndexOf("}");
    if (lastBrace === -1) {
      logger.error(
        "Groq response did not contain a valid JSON object (no closing brace).",
        { rawContent, provider: this.providerName },
      );
      throw new Error("Response did not contain a valid JSON object.");
    }

    let braceCount = 0;
    let firstBrace = -1;
    for (let i = lastBrace; i >= 0; i--) {
      if (rawContent[i] === "}") {
        braceCount++;
      }
      if (rawContent[i] === "{") {
        braceCount--;
        if (braceCount === 0) {
          firstBrace = i;
          break;
        }
      }
    }

    if (firstBrace === -1) {
      logger.error(
        "Groq response did not contain a valid JSON object (no matching opening brace).",
        { rawContent, provider: this.providerName },
      );
      throw new Error("Response did not contain a valid JSON object.");
    }

    const jsonString = rawContent.substring(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(jsonString) as T;
    } catch (e: any) {
      logger.error("Failed to parse JSON from Groq response", {
        jsonString,
        error: e.message,
      });
      throw new Error(`Invalid JSON from ${this.providerName}: ${e.message}`);
    }
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
      