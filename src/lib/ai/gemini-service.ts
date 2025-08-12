import type {
  AIModel,
  GeminiModel,
  MultimodalAIProvider,
} from "./types";
import { withRetry } from "../utils/withRetry";
import { getAllKeys } from "./gemini-key-provider";
import { logger } from "../logger";
import axios from "axios";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import crypto from "crypto";
import type { TutorChatMessage } from "@/lib/types";

// Local types to replace SDK enums
type HarmCategory =
  | "HARM_CATEGORY_DANGEROUS_CONTENT"
  | "HARM_CATEGORY_HARASSMENT"
  | "HARM_CATEGORY_HATE_SPEECH"
  | "HARM_CATEGORY_SEXUALLY_EXPLICIT";

type HarmBlockThreshold =
  | "BLOCK_NONE"
  | "BLOCK_ONLY_HIGH"
  | "BLOCK_MEDIUM_AND_ABOVE"
  | "BLOCK_LOW_AND_ABOVE";

const safetySettings: { category: HarmCategory; threshold: HarmBlockThreshold }[] =
  [
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  ];

export class GeminiService implements MultimodalAIProvider {
  readonly providerName = "Gemini";

  private cleanJsonString(text: string): string {
    // Gemini often wraps JSON in ```json ... ``` or just ``` ... ```
    const match = text.match(/```(?:json)?([\s\S]*?)```/);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Fallback for raw JSON without code fences
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }

    return text.trim();
  }

  private async executeRequest<T>(
    requestFn: (apiKey: string) => Promise<T>,
  ): Promise<T> {
    const allKeys = getAllKeys();
    if (allKeys.length === 0) {
      throw new Error("No Gemini API keys provided.");
    }
    let lastError: any;
    for (const [index, apiKey] of allKeys.entries()) {
      try {
        return await withRetry(() => requestFn(apiKey));
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const errorMessage = (error.message || "").toLowerCase();

        if (
          status === 429 ||
          status === 401 ||
          status === 403 ||
          (status && status >= 500 && status <= 599) ||
          errorMessage.includes("api key not valid")
        ) {
          logger.warn(
            `Gemini key #${index + 1} failed. Rotating. Error: ${
              error.message
            }`,
          );
          continue;
        }
        throw error;
      }
    }

    const lastStatus = lastError.response?.status;
    let lastErrorDetails;
    if (
      lastError.response?.data &&
      typeof lastError.response.data === "object"
    ) {
      lastErrorDetails = JSON.stringify(lastError.response.data);
    } else {
      lastErrorDetails = lastError.message;
    }

    throw new Error(
      `All Gemini API keys failed. Last error: ${lastErrorDetails} (Status: ${lastStatus})`,
    );
  }

  private async _uploadFile(
    apiKey: string,
    media: { buffer: Buffer; mimeType: string } | { url: string },
  ): Promise<{ name: string; uri: string; mimeType: string }> {
    let buffer: Buffer;
    let mimeType: string;

    if ("url" in media) {
      const response = await axios.get(media.url, {
        responseType: "arraybuffer",
      });
      buffer = response.data;
      mimeType =
        response.headers["content-type"] || "application/octet-stream";
    } else {
      buffer = media.buffer;
      mimeType = media.mimeType;
    }

    const startUploadResponse = await axios.post(
      `https://generativelanguage.googleapis.com/upload/v1beta/files`,
      { file: { display_name: `upload-${Date.now()}` } },
      {
        headers: {
          "x-goog-api-key": apiKey,
          "X-Goog-Upload-Protocol": "resumable",
          "X-Goog-Upload-Command": "start",
          "X-Goog-Upload-Header-Content-Length": buffer.length,
          "X-Goog-Upload-Header-Content-Type": mimeType,
          "Content-Type": "application/json",
        },
      },
    );

    const uploadUrl = startUploadResponse.headers["x-goog-upload-url"];
    if (!uploadUrl) {
      throw new Error("Failed to get upload URL from Gemini API.");
    }

    const uploadResponse = await axios.post(uploadUrl, buffer, {
      headers: {
        "Content-Length": buffer.length,
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
        "Content-Type": mimeType,
      },
    });

    const fileData = uploadResponse.data.file;
    if (!fileData || !fileData.name || !fileData.uri) {
      throw new Error("Finalize upload response is missing file data.");
    }
    return { name: fileData.name, uri: fileData.uri, mimeType };
  }

  private async _deleteFile(apiKey: string, fileName: string): Promise<void> {
    try {
      await axios.delete(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}`,
        { headers: { "x-goog-api-key": apiKey } },
      );
    } catch (error) {
      logger.error(`Failed to delete Gemini file: ${fileName}`, error);
    }
  }

  async generateJsonWithImage<T>(
    prompt: string,
    model: AIModel,
    imageUrl: string,
  ): Promise<T> {
    return this.executeRequest(async (apiKey) => {
      let uploadedFile;
      try {
        uploadedFile = await this._uploadFile(apiKey, { url: imageUrl });

        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  file_data: {
                    mime_type: uploadedFile.mimeType,
                    file_uri: uploadedFile.uri,
                  },
                },
              ],
            },
          ],
          generationConfig: { response_mime_type: "application/json" },
          safetySettings,
        };

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          payload,
          { headers: { "x-goog-api-key": apiKey } },
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Gemini API");

        const jsonString = this.cleanJsonString(text);
        try {
          return JSON.parse(jsonString) as T;
        } catch (e) {
          logger.error("Failed to parse JSON from Gemini response", {
            jsonString,
            rawResponse: text,
          });
          throw new Error("Invalid JSON response from Gemini.");
        }
      } finally {
        if (uploadedFile) {
          await this._deleteFile(apiKey, uploadedFile.name);
        }
      }
    });
  }

  async generateJson<T>(prompt: string, model: AIModel): Promise<T> {
    return this.executeRequest(async (apiKey) => {
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" },
        safetySettings,
      };
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        payload,
        { headers: { "x-goog-api-key": apiKey } },
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini API");

      const jsonString = this.cleanJsonString(text);
      try {
        return JSON.parse(jsonString) as T;
      } catch (e) {
        logger.error("Failed to parse JSON from Gemini response", {
          jsonString,
          rawResponse: text,
        });
        throw new Error("Invalid JSON response from Gemini.");
      }
    });
  }

  async generateText(prompt: string, model: AIModel): Promise<string> {
    return this.executeRequest(async (apiKey) => {
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings,
      };
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        payload,
        { headers: { "x-goog-api-key": apiKey } },
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini API");
      return text.trim();
    });
  }

  async generateChatCompletion(
    systemPrompt: string,
    messages: TutorChatMessage[],
    model: AIModel,
  ): Promise<string> {
    return this.executeRequest(async (apiKey) => {
      const payload = {
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        safetySettings,
      };
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        payload,
        { headers: { "x-goog-api-key": apiKey } },
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty chat response from Gemini API");
      return text.trim();
    });
  }
}