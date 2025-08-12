import type { TutorChatMessage } from "@/lib/types";

// AI Model Types
export type CerebrasModel =
  | "gpt-oss-120b"
  | "qwen-3-235b-a22b-thinking-2507";
export type GroqModel = "openai/gpt-oss-120b" | "moonshotai/kimi-k2-instruct";
export type GeminiModel = "gemini-2.5-flash";

export type AIModel = CerebrasModel | GroqModel | GeminiModel;

// Base interface for text-only providers
export interface TextAIProvider {
  readonly providerName: string;
  generateJson<T>(prompt: string, model: AIModel): Promise<T>;
  generateText(prompt: string, model: AIModel): Promise<string>;
  generateChatCompletion(
    systemPrompt: string,
    messages: TutorChatMessage[],
    model: AIModel,
  ): Promise<string>;
}

// Interface for providers supporting image input
export interface MultimodalAIProvider extends TextAIProvider {
  generateJsonWithImage<T>(
    prompt: string,
    model: AIModel,
    imageUrl: string,
  ): Promise<T>;
}