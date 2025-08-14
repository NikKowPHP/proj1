// This file will be populated with types for the new application in later phases.

export interface TutorChatMessage {
  role: "user" | "assistant";
  content: string;
}

// AI Model Types
export type CerebrasModel =
  | "gpt-oss-120b"
  | "qwen-3-235b-a22b-thinking-2507";
export type GroqModel = "openai/gpt-oss-120b" | "moonshotai/kimi-k2-instruct";
export type GeminiModel =
  | "gemini-1.5-pro-latest"
  | "gemini-2.5-flash-latest"
  | "gemini-2.5-flash";

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

// A single risk factor from a model's assessment
interface RiskFactor {
  factor: string;
  riskLevel: "Low" | "Moderate" | "High";
  explanation: string;
}

// The assessment results for a single model (e.g., General Cancer)
interface ModelAssessment {
  modelName: string;
  riskFactors: RiskFactor[];
}

// Assessment Result Type (final output from AI to client)
export interface AssessmentResult {
  overallSummary: string;
  modelAssessments: ModelAssessment[];
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

// --- New types for the multi-model architecture (v2) ---

/**
 * Represents the results for a single risk model (e.g., General Cancer, Lung Cancer).
 */
export interface ModelResult {
  modelId: string;
  modelName: string;
  riskFactors: CalculatedRiskFactor[];
}

/**
 * The data contract for the output of the multi-model deterministic risk calculation engine.
 * This object is the "source of truth" that will be passed to the AI for explanation.
 */
export interface MultiCalculationResult {
  modelResults: ModelResult[];
  positiveFactors: IdentifiedPositiveFactor[];
  userAnswers: Record<string, string>;
}
