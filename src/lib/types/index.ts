// This file will be populated with types for the new application in later phases.

// AI Model Types
export type CerebrasModel =
  | "gpt-oss-120b"
  | "qwen-3-235b-a22b-thinking-2507";
export type GroqModel = "openai/gpt-oss-120b" | "moonshotai/kimi-k2-instruct";
export type GeminiModel = "gemini-1.5-flash";

export type AIModel = CerebrasModel | GroqModel | GeminiModel;

// Base interface for text-only providers
export interface TextAIProvider {
  readonly providerName: string;
  generateJson<T>(prompt: string, model: AIModel): Promise<T>;
  generateText(prompt: string, model: AIModel): Promise<string>;
  generateChatCompletion(
    systemPrompt: string,
    messages: any[], // Simplified for now
    model: AIModel,
  ): Promise<string>;
}

// Assessment Result Type (final output from AI to client)
export interface AssessmentResult {
  riskFactors: {
    factor: string;
    riskLevel: "Low" | "Moderate" | "High";
    explanation: string;
  }[];
  positiveFactors: {
    factor: string;
    explanation: string;
  }[];
  recommendations: string[];
}

// --- New types for the deterministic calculation engine ---

/**
 * The risk level calculated by the deterministic engine.
 * 'Average' will be translated to 'Moderate' by the AI for user-facing output.
 */
export type CalculatedRiskLevel = "Low" | "Average" | "High";

/**
 * Represents a single risk factor calculated by the deterministic engine.
 */
export interface CalculatedRiskFactor {
  id: string; // e.g., 'SMOKING_RELATED'
  name: string; // e.g., 'Smoking-Related Risk'
  level: CalculatedRiskLevel;
  score: number;
}

/**
 * Represents a positive lifestyle factor identified by the deterministic engine.
 */
export interface IdentifiedPositiveFactor {
  id: string; // e.g., 'EXERCISE'
  name: string; // e.g., 'Regular Physical Activity'
  description: string;
}

/**
 * The data contract for the output of the deterministic risk calculation engine.
 * This object is the "source of truth" that will be passed to the AI for explanation.
 */
export interface CalculationResult {
  riskFactors: CalculatedRiskFactor[];
  positiveFactors: IdentifiedPositiveFactor[];
  userAnswers: Record<string, string>;
}