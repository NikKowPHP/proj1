My plan is to refactor the core assessment logic to support multiple health risk models, as outlined in Epic 1.

Here is my plan:

1.  **Update Data Structures (`src/lib/types/index.ts`):** I will introduce new `MultiCalculationResult` and `ModelResult` types to represent output from multiple risk models, and I will remove the now-obsolete `CalculationResult` type.
2.  **Restructure Configuration (`src/lib/risk-model-config.json`):** The risk model configuration will be nested under a new `models` object to support multiple, distinct model definitions, starting with the existing one, `GENERAL_CANCER_V1`.
3.  **Refactor Backend Service (`src/lib/services/risk-calculator.service.ts`):** I will refactor the `calculateRisk` function into `calculateAllRisks`. This new function will loop through all configured models, calculate their risks individually using a new helper function, and return the `MultiCalculationResult`.
4.  **Update AI Prompt:** I will rename `src/lib/ai/prompts/cancerRiskAssessment.prompt.ts` to `src/lib/ai/prompts/multiRiskAssessment.prompt.ts` and update its content to instruct the AI to synthesize a single, cohesive assessment from the new multi-model data structure.
5.  **Update AI Service (`src/lib/ai/composite-ai.service.ts`):** I will modify the `getRiskAssessmentExplanation` method to use the new prompt and data types.
6.  **Update API Endpoint (`src/app/api/assess/route.ts`):** The API will be updated to call the new `calculateAllRisks` service and pass its structured result to the AI.
7.  **Update Tests:** I will remove the old test file for the risk calculator and create a new one (`risk-calculator.service.v2.test.ts`) to validate the new multi-model logic. I will also update the API endpoint test (`src/app/api/assess/route.test.ts`) to use the new data structures.
8.  **Update Task List:** Finally, I will mark all tasks in Epic 1 of `TASKS.md` as complete.

### BASH COMMANDS
```bash
mv "src/lib/ai/prompts/cancerRiskAssessment.prompt.ts" "src/lib/ai/prompts/multiRiskAssessment.prompt.ts"
rm "src/lib/services/risk-calculator.service.test.ts"
```
-------------------------------------------------------------------------------
### src/lib/types/index.ts
```typescript
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
export type GeminiModel = "gemini-1.5-flash";

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
```
-------------------------------------------------------------------------------
### src/lib/risk-model-config.json
```json
{
  "models": {
    "GENERAL_CANCER_V1": {
      "name": "General Cancer Risk",
      "factors": {
        "SMOKING_RELATED": {
          "name": "Smoking-Related Risk",
          "questionIds": ["smoking_status"],
          "thresholds": { "average": 3, "high": 9 }
        },
        "LIFESTYLE_CHOICES": {
          "name": "Lifestyle Choices Risk",
          "questionIds": ["alcohol", "activity", "diet_fruits_veg", "diet_red_meat"],
          "thresholds": { "average": 7, "high": 12 }
        },
        "DEMOGRAPHIC": {
          "name": "Demographic Risk",
          "questionIds": ["age", "sex"],
          "thresholds": { "average": 5, "high": 9 }
        },
        "BODY_COMPOSITION": {
          "name": "Body Composition Risk (BMI)",
          "questionIds": ["bmi_category"],
          "thresholds": { "average": 4, "high": 7 }
        },
        "GENETIC_PREDISPOSITION": {
          "name": "Genetic Predisposition",
          "questionIds": ["family_history_cancer"],
          "thresholds": { "average": 2, "high": 9 }
        }
      },
      "weights": {
        "smoking_status": {
          "Never smoked": 0,
          "Former smoker": 3,
          "Current smoker": 10
        },
        "alcohol": {
          "None": 0,
          "1-2": 1,
          "3-7": 3,
          "8-14": 5,
          "15+": 7
        },
        "activity": {
          "0 days": 5,
          "1-2 days": 3,
          "3-4 days": 0,
          "5+ days": -2
        },
        "diet_fruits_veg": {
          "0-1": 5,
          "2-3": 2,
          "4-5": 0,
          "6+": -2
        },
        "diet_red_meat": {
          "Never or rarely": 0,
          "1-2 times": 2,
          "3-4 times": 4,
          "5+ times": 6
        },
        "age": {
          "18-29": 0,
          "30-39": 2,
          "40-49": 4,
          "50-59": 6,
          "60+": 8
        },
        "sex": {
          "Male": 1,
          "Female": 0
        },
        "family_history_cancer": {
          "No": 0,
          "I don't know": 2,
          "Yes": 10
        },
        "bmi_category": {
          "Underweight": 3,
          "Normal": 0,
          "Overweight": 4,
          "Obese": 8
        }
      }
    }
  },
  "positiveFactors": {
    "NON_SMOKER": {
      "name": "Non-Smoker",
      "description": "Not smoking is one of the most significant actions you can take to lower your health risks.",
      "trigger": {
        "questionId": "smoking_status",
        "answers": ["Never smoked"]
      }
    },
    "EXERCISE": {
      "name": "Regular Physical Activity",
      "description": "Consistent physical activity is crucial for maintaining good health and reducing various risks.",
      "trigger": {
        "questionId": "activity",
        "answers": ["5+ days"]
      }
    },
    "HEALTHY_DIET": {
      "name": "Healthy Diet",
      "description": "A diet rich in fruits and vegetables provides essential nutrients and protective benefits.",
      "trigger": {
        "questionId": "diet_fruits_veg",
        "answers": ["6+"]
      }
    }
  }
}
```
-------------------------------------------------------------------------------
### src/lib/services/risk-calculator.service.ts
```typescript
import type {
  MultiCalculationResult,
  ModelResult,
  CalculatedRiskFactor,
  IdentifiedPositiveFactor,
  CalculatedRiskLevel,
} from "@/lib/types";
import riskConfig from "@/lib/risk-model-config.json";
import { logger } from "../logger";

type Answers = Record<string, string>;
type ModelConfig = (typeof riskConfig.models)[keyof typeof riskConfig.models];

/**
 * Determines the risk level based on a score and predefined thresholds.
 */
function getRiskLevel(
  score: number,
  thresholds: { average: number; high: number },
): CalculatedRiskLevel {
  if (score >= thresholds.high) {
    return "High";
  }
  if (score >= thresholds.average) {
    return "Average";
  }
  return "Low";
}

function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi >= 18.5 && bmi < 25) return "Normal";
  if (bmi >= 25 && bmi < 30) return "Overweight";
  return "Obese"; // bmi >= 30
}

/**
 * Calculates risk factors for a single model configuration.
 */
function calculateRiskForModel(
  answers: Answers,
  modelConfig: ModelConfig,
): CalculatedRiskFactor[] {
  const calculatedFactors: CalculatedRiskFactor[] = [];

  for (const factorId in modelConfig.factors) {
    const factorInfo =
      modelConfig.factors[factorId as keyof typeof modelConfig.factors];
    let score = 0;

    for (const questionId of factorInfo.questionIds) {
      const answer = answers[questionId];
      if (answer) {
        const questionWeights =
          modelConfig.weights[questionId as keyof typeof modelConfig.weights];
        if (questionWeights) {
          score += (questionWeights as any)[answer] ?? 0;
        }
      }
    }

    calculatedFactors.push({
      id: factorId,
      name: factorInfo.name,
      score: score,
      level: getRiskLevel(score, factorInfo.thresholds),
    });
  }
  return calculatedFactors;
}

/**
 * Identifies positive lifestyle factors based on answers.
 */
function identifyPositiveFactors(
  answers: Answers,
): IdentifiedPositiveFactor[] {
  const positiveFactors: IdentifiedPositiveFactor[] = [];
  for (const factorId in riskConfig.positiveFactors) {
    const positiveFactorInfo =
      riskConfig.positiveFactors[
        factorId as keyof typeof riskConfig.positiveFactors
      ];
    const triggerAnswer = answers[positiveFactorInfo.trigger.questionId];

    if (
      triggerAnswer &&
      positiveFactorInfo.trigger.answers.includes(triggerAnswer)
    ) {
      positiveFactors.push({
        id: factorId,
        name: positiveFactorInfo.name,
        description: positiveFactorInfo.description,
      });
    }
  }
  return positiveFactors;
}

/**
 * Calculates a user's health risks across multiple models based on their answers.
 * This function uses a deterministic model defined in `risk-model-config.json`.
 *
 * @param answers A record of question IDs and the user's corresponding answers.
 * @returns A `MultiCalculationResult` object containing results from all models.
 */
export function calculateAllRisks(answers: Answers): MultiCalculationResult {
  const modelResults: ModelResult[] = [];
  const processedAnswers = { ...answers };

  // --- Start of BMI Calculation ---
  const heightStr = processedAnswers.height;
  const weightStr = processedAnswers.weight;
  const units = processedAnswers.units;

  if (heightStr && weightStr && units) {
    const height = parseFloat(heightStr);
    const weight = parseFloat(weightStr);

    let heightInMeters: number;
    let weightInKg: number;

    if (units === "imperial") {
      heightInMeters = height * 0.0254;
      weightInKg = weight * 0.453592;
    } else {
      heightInMeters = height / 100;
      weightInKg = weight;
    }

    if (heightInMeters > 0) {
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      const bmiCategory = getBmiCategory(bmi);
      processedAnswers.bmi_category = bmiCategory;
    }
  }
  // --- End of BMI Calculation ---

  // 1. Calculate scores for each model
  for (const modelId in riskConfig.models) {
    try {
      const modelConfig =
        riskConfig.models[modelId as keyof typeof riskConfig.models];
      const riskFactors = calculateRiskForModel(processedAnswers, modelConfig);
      modelResults.push({
        modelId,
        modelName: modelConfig.name,
        riskFactors,
      });
    } catch (error) {
      logger.error(`Error calculating risk for model ${modelId}`, {
        error,
        answers,
      });
      // Continue to next model, returning partial results.
    }
  }

  // 2. Identify positive lifestyle factors (globally)
  const positiveFactors = identifyPositiveFactors(processedAnswers);

  return {
    modelResults,
    positiveFactors,
    userAnswers: answers, // Return original answers for AI context
  };
}
```
-------------------------------------------------------------------------------
### src/lib/ai/prompts/multiRiskAssessment.prompt.ts
```typescript
import type { MultiCalculationResult } from "@/lib/types";

export const getMultiRiskAssessmentPrompt = (
  calculationResult: MultiCalculationResult,
) => `
You are an AI health assistant. Your task is to analyze results from multiple deterministic risk models and synthesize them into a single, cohesive, and user-friendly explanation. You must not provide a medical diagnosis or calculate any new risks. Your response MUST be a single raw JSON object.

**PRE-CALCULATED ASSESSMENT DATA:**
This data was generated by multiple deterministic models. Your job is to translate it into a single, unified, and easy-to-understand narrative explanation.
${JSON.stringify(calculationResult, null, 2)}

**YOUR TASK:**
Analyze the pre-calculated data from all models and generate a response in the following single JSON format. The tone should be helpful, reassuring, and encouraging, not alarming. Focus on actionable advice.

{
  "riskFactors": [
    {
      "factor": "The 'name' of a calculated risk factor from the input (e.g., 'Smoking-Related Risk'). If the same factor (e.g., BMI) appears in multiple models, present it as a single entry but synthesize the context.",
      "riskLevel": "'Low', 'Moderate', or 'High'. You MUST map 'Average' from the input to 'Moderate' for the user.",
      "explanation": "A gentle, evidence-based explanation of this risk category and why the user's result places them here. Connect it to their specific answers from the 'userAnswers' object where appropriate. Keep it concise (2-3 sentences)."
    }
  ],
  "positiveFactors": [
    {
      "factor": "The 'name' of an identified positive factor from the input (e.g., 'Regular Physical Activity').",
      "explanation": "A brief, encouraging sentence acknowledging this positive behavior, using its 'description' from the input as a basis."
    }
  ],
  "recommendations": [
    "A general, actionable recommendation relevant to the highest risk factors (e.g., 'Exploring strategies to reduce alcohol consumption can have a significant positive impact.').",
    "Synthesize recommendations that address risks across multiple models.",
    "A strong recommendation to consult a healthcare professional for personalized advice and to discuss these results."
  ]
}

**GUIDELINES:**
1.  **Synthesize, Don't List:** Do not just list results from each model separately. Combine and synthesize the findings into a single, clear narrative. The user should see one set of risk factors, not one set per model.
2.  **Safety First:** Do NOT diagnose. Use phrases like "This assessment suggests...", "Factors like these are associated with...", or "This result is based on...".
3.  **Map Risk Levels:** Convert the input level 'Average' from any model to the output level 'Moderate'. 'Low' and 'High' remain the same.
4.  **Balance:** Give equal attention to acknowledging positive factors and explaining risk factors.
5.  **Sensitive Topics:**
    - For **'Body Composition Risk (BMI)'**: Explain that BMI is one of many health indicators and doesn't tell the whole story. Suggest discussing healthy weight management with a professional.
    - For **'Genetic Predisposition'**: Be extra cautious. Emphasize that having a family history does NOT mean a person will get cancer. Strongly advise that this makes regular screenings and conversations with a doctor especially important.
6.  **Crucial Disclaimer:** The final recommendation MUST ALWAYS be to consult a healthcare provider.

Now, generate the synthesized assessment explanation based on the provided multi-model data.
`;
```
-------------------------------------------------------------------------------
### src/lib/ai/composite-ai.service.ts
```typescript
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
  ) {
    const prompt = getMultiRiskAssessmentPrompt(calculationResult);
    const providerChain = this.getProviderChain("large");
    return executeWithFallbacks(
      providerChain,
      (provider, model) => provider.generateJson(prompt, model),
      userId,
    );
  }
}
```
-------------------------------------------------------------------------------
### src/app/api/assess/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { ipRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { getAIService } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateAllRisks } from "@/lib/services/risk-calculator.service";

const answersSchema = z
  .object({
    units: z.enum(["metric", "imperial"]),
    height: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Invalid height. Must be a positive number.",
    }),
    weight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Invalid weight. Must be a positive number.",
    }),
  })
  .catchall(z.string().optional());

// Zod schema for the AI response to ensure type safety remains the same
const riskFactorSchema = z.object({
  factor: z.string(),
  riskLevel: z.enum(["Low", "Moderate", "High"]),
  explanation: z.string(),
});

const positiveFactorSchema = z.object({
  factor: z.string(),
  explanation: z.string(),
});

const aiResponseSchema = z.object({
  riskFactors: z.array(riskFactorSchema),
  positiveFactors: z.array(positiveFactorSchema),
  recommendations: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";

  const limit = ipRateLimiter(ip);
  if (!limit.allowed) {
    logger.warn(`[API:assess] IP rate limit exceeded for: ${ip}`);
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsedAnswers = answersSchema.safeParse(body.answers);

    if (!parsedAnswers.success) {
      return NextResponse.json(
        { error: "Invalid answers format", details: parsedAnswers.error.flatten() },
        { status: 400 },
      );
    }

    // 1. Run deterministic calculation across all models
    const calculationResult = calculateAllRisks(parsedAnswers.data as Record<string, string>);

    // 2. Get AI-powered explanation for the calculation
    const aiService = getAIService();
    const { result, serviceUsed } =
      await aiService.getRiskAssessmentExplanation(calculationResult);

    // 3. Validate the AI's explanation response
    const validatedResult = aiResponseSchema.safeParse(result);
    if (!validatedResult.success) {
      logger.error("AI response validation failed", {
        error: validatedResult.error,
        serviceUsed,
        calculationResult, // Also log the deterministic result for debugging
      });
      await prisma.assessmentLog.create({
        data: { status: "AI_VALIDATION_ERROR" },
      });
      return NextResponse.json(
        { error: "Failed to process assessment due to invalid AI response" },
        { status: 502 },
      );
    }

    await prisma.assessmentLog.create({
      data: { status: "SUCCESS" },
    });

    return NextResponse.json(validatedResult.data);
  } catch (error) {
    logger.error("Error in /api/assess", error);
    await prisma.assessmentLog.create({
      data: { status: "SERVER_ERROR" },
    });
    return NextResponse.json(
      { error: "Failed to process assessment" },
      { status: 500 },
    );
  }
}
```
-------------------------------------------------------------------------------
### src/lib/services/risk-calculator.service.v2.test.ts
```typescript
/** @jest-environment node */

import { calculateAllRisks } from "./risk-calculator.service";
import type { MultiCalculationResult } from "../types";
// Mock the config to isolate test
jest.mock(
  "@/lib/risk-model-config.json",
  () => ({
    models: {
      GENERAL_CANCER_V1: {
        name: "General Cancer Risk",
        factors: {
          SMOKING: {
            name: "Smoking Risk",
            questionIds: ["smoking_status"],
            thresholds: { average: 5, high: 10 },
          },
        },
        weights: {
          smoking_status: {
            "Current smoker": 10,
          },
        },
      },
      TEST_MODEL_V1: {
        name: "Test Model",
        factors: {
          LIFESTYLE: {
            name: "Lifestyle Risk",
            questionIds: ["activity"],
            thresholds: { average: 2, high: 4 },
          },
        },
        weights: {
          activity: {
            "0 days": 5,
          },
        },
      },
    },
    positiveFactors: {
      EXERCISE: {
        name: "Regular Physical Activity",
        description: "desc",
        trigger: {
          questionId: "activity",
          answers: ["5+ days"],
        },
      },
    },
  }),
  { virtual: true },
);

describe("Risk Calculator Service (v2 - Multi-Model)", () => {
  it("should calculate risks for all defined models", () => {
    const answers = {
      smoking_status: "Current smoker",
      activity: "0 days",
    };
    const result: MultiCalculationResult = calculateAllRisks(answers);

    expect(result.modelResults).toHaveLength(2);

    const generalCancerResult = result.modelResults.find(
      (m) => m.modelId === "GENERAL_CANCER_V1",
    );
    expect(generalCancerResult).toBeDefined();
    expect(generalCancerResult?.modelName).toBe("General Cancer Risk");
    expect(generalCancerResult?.riskFactors[0].score).toBe(10);
    expect(generalCancerResult?.riskFactors[0].level).toBe("High");

    const testModelResult = result.modelResults.find(
      (m) => m.modelId === "TEST_MODEL_V1",
    );
    expect(testModelResult).toBeDefined();
    expect(testModelResult?.modelName).toBe("Test Model");
    expect(testModelResult?.riskFactors[0].score).toBe(5);
    expect(testModelResult?.riskFactors[0].level).toBe("High");
  });

  it("should identify positive factors globally", () => {
    const answers = {
      activity: "5+ days",
    };
    const result: MultiCalculationResult = calculateAllRisks(answers);
    expect(result.positiveFactors).toHaveLength(1);
    expect(result.positiveFactors[0].id).toBe("EXERCISE");
  });

  it("should handle partial failures gracefully and return results for successful models", () => {
    // We can't easily mock a failure inside the static json import,
    // but we can test that an empty model config doesn't break it.
    const answers = {};
    const result: MultiCalculationResult = calculateAllRisks(answers);
    expect(result.modelResults.length).toBeGreaterThan(0); // It should still process what it can
  });
});
```
-------------------------------------------------------------------------------
### src/app/api/assess/route.test.ts
```typescript
/** @jest-environment node */

import { POST } from "./route";
import { createRequest } from "node-mocks-http";
import * as riskCalculator from "@/lib/services/risk-calculator.service";
import * as ai from "@/lib/ai";
import { prisma } from "@/lib/db";
import { MultiCalculationResult } from "@/lib/types";

// Mock dependencies
jest.mock("@/lib/services/risk-calculator.service");
jest.mock("@/lib/ai");
jest.mock("@/lib/db", () => ({
  prisma: {
    assessmentLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

const mockedCalculateAllRisks = riskCalculator.calculateAllRisks as jest.Mock;
const mockedGetAIService = ai.getAIService as jest.Mock;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("POST /api/assess", () => {
  const mockAIExplanation = {
    riskFactors: [
      {
        factor: "Test Risk",
        riskLevel: "High",
        explanation: "AI explanation",
      },
    ],
    positiveFactors: [{ factor: "Test Positive", explanation: "Good job" }],
    recommendations: ["See a doctor"],
  };

  const mockCalculationResult: MultiCalculationResult = {
    modelResults: [
      {
        modelId: "GENERAL_CANCER_V1",
        modelName: "General Cancer Risk",
        riskFactors: [
          { id: "TEST", name: "Test Risk", score: 10, level: "High" },
        ],
      },
    ],
    positiveFactors: [],
    userAnswers: { age: "60+" },
  };

  const mockAIService = {
    getRiskAssessmentExplanation: jest.fn().mockResolvedValue({
      result: mockAIExplanation,
      serviceUsed: "mock-ai",
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAIService.mockReturnValue(mockAIService);
    mockedCalculateAllRisks.mockReturnValue(mockCalculationResult);
  });

  it("should orchestrate the hybrid flow correctly", async () => {
    const userAnswers = { age: "60+", smoking: "Yes" };
    const req = createRequest({
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: { answers: userAnswers },
    });

    const response = await POST(req as any);
    const responseJson = await response.json();

    // 1. Assert risk calculator was called with user answers
    expect(mockedCalculateAllRisks).toHaveBeenCalledTimes(1);
    expect(mockedCalculateAllRisks).toHaveBeenCalledWith(userAnswers);

    // 2. Assert AI service was called with the result of the calculation
    expect(mockAIService.getRiskAssessmentExplanation).toHaveBeenCalledTimes(1);
    expect(mockAIService.getRiskAssessmentExplanation).toHaveBeenCalledWith(
      mockCalculationResult,
    );

    // 3. Assert the final response is the AI explanation
    expect(response.status).toBe(200);
    expect(responseJson).toEqual(mockAIExplanation);

    // 4. Assert a success log was created
    expect(mockPrisma.assessmentLog.create).toHaveBeenCalledWith({
      data: { status: "SUCCESS" },
    });
  });

  it("should return 400 for invalid answers format", async () => {
    const req = createRequest({
      method: "POST",
      body: { answers: "not-an-object" },
    });

    const response = await POST(req as any);
    const responseJson = await response.json();

    expect(response.status).toBe(400);
    expect(responseJson.error).toBe("Invalid answers format");
    expect(mockedCalculateAllRisks).not.toHaveBeenCalled();
    expect(mockAIService.getRiskAssessmentExplanation).not.toHaveBeenCalled();
  });

  it("should return 502 if AI response validation fails", async () => {
    // Mock AI to return an invalid response
    mockAIService.getRiskAssessmentExplanation.mockResolvedValueOnce({
      result: { bad: "data" }, // Invalid structure
      serviceUsed: "mock-ai",
    });

    const userAnswers = { age: "60+" };
    const req = createRequest({
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: { answers: userAnswers },
    });

    const response = await POST(req as any);
    const responseJson = await response.json();

    expect(response.status).toBe(502);
    expect(responseJson).toEqual({
      error: "Failed to process assessment due to invalid AI response",
    });

    // Assert a validation error log was created
    expect(mockPrisma.assessmentLog.create).toHaveBeenCalledWith({
      data: { status: "AI_VALIDATION_ERROR" },
    });
  });
});
```
-------------------------------------------------------------------------------
### TASKS.md
```markdown
# Plan: Expand Assessment Scope to Multiple Conditions (v2)

**Vision:** Evolve the application from a single general risk assessment to a multi-condition dashboard, providing distinct risk profiles for various cancers and other health conditions. This will be done in phases, starting with a foundational refactoring, followed by the incremental addition of new assessment modules.

**Note:** This plan proceeds with modifying the existing `/api/assess` endpoint directly, accepting the risk of breaking cached clients upon deployment to maintain a simpler codebase.

---

## Epic 1: Foundational Refactoring for Extensibility

**Goal:** Refactor the core services and data structures to support multiple, independent risk models. This is a non-negotiable first step.

### **Data Structures & Types (`src/lib/types/index.ts`)**
- [x] `[SCOPE-001]` Define a new `MultiCalculationResult` interface that contains an array of `modelResults` and a single `positiveFactors` array.
- [x] `[SCOPE-002]` Define a `ModelResult` interface within `MultiCalculationResult` to hold `modelId`, `modelName`, and `riskFactors`.

### **Configuration (`src/lib/risk-model-config.json`)**
- [x] `[SCOPE-003]` Restructure the `risk-model-config.json` file. Nest the existing `factors` and `weights` under a new top-level `models` object, with the first entry being `GENERAL_CANCER_V1`.

### **Backend Service (`src/lib/services/risk-calculator.service.ts`)**
- [x] `[SCOPE-004]` Refactor the main `calculateRisk` function into `calculateAllRisks`, which now returns the new `MultiCalculationResult` type.
- [x] `[SCOPE-005]` The `calculateAllRisks` function must loop through each model defined in `risk-config.models` and calculate its specific risks.
- [x] `[SCOPE-006]` Create a new internal helper function `calculateRiskForModel(answers, modelConfig)` to encapsulate the logic for calculating a single model's score.
- [x] `[SCOPE-007]` Refactor the positive factor logic into a separate, globally-run `identifyPositiveFactors(answers)` function.
- [x] `[SCOPE-008]` Define and implement an error handling strategy within `calculateAllRisks`. Decide whether to return partial results or fail the entire request if one model's calculation fails.

### **API Endpoint (`src/app/api/assess/route.ts`)**
- [x] `[SCOPE-009]` Modify the `POST /api/assess` route to call the new `calculateAllRisks` service and handle its new `MultiCalculationResult` structure.
- [x] `[SCOPE-010]` Update the API to pass the new `MultiCalculationResult` structure to the AI service for explanation.

### **AI Service & Prompts**
- [x] `[SCOPE-011]` Create a new prompt `getMultiRiskAssessmentPrompt` in `src/lib/ai/prompts/` that accepts the `MultiCalculationResult` JSON structure as input.
- [x] `[SCOPE-012]` Update `CompositeAIService.getRiskAssessmentExplanation` to use this new prompt and expect a synthesized JSON response from the AI.

### **Testing & QA**
- [x] `[SCOPE-013]` Create a new test file `risk-calculator.service.v2.test.ts` to validate the new multi-model calculation logic, including the partial failure strategy.
- [x] `[SCOPE-014]` Update the existing test for `POST /api/assess` to mock the new data structures and validate the refactored flow.
- [x] `[SCOPE-015]` [QA] Benchmark the end-to-end response time of the `/api/assess` endpoint after the refactoring to establish a new baseline.

---

## Epic 2: Add Lung Cancer Module (First Extension)

**Goal:** Implement the first new, end-to-end risk profile for Lung Cancer, validating the new extensible architecture.

### **Questionnaire (`src/lib/assessment-questions.json`)**
- [ ] `[SCOPE-016]` Add new lung cancer-specific questions to the questionnaire (e.g., "How many years have you smoked?", "Have you been exposed to asbestos?").
- [ ] `[SCOPE-017]` [UX] Review the extended questionnaire flow to mitigate user fatigue. Consider showing a more detailed progress indicator (e.g., "Section 2 of 5: Lifestyle Habits").

### **Configuration (`src/lib/risk-model-config.json`)**
- [ ] `[SCOPE-018]` Add a new `LUNG_CANCER_V1` model definition to the `models` object in the config, with its own specific factors and weights.

### **Frontend UI (`src/app/results/page.tsx`)**
- [ ] `[SCOPE-019]` Modify the `useRiskAssessment` hook and its consumer on the results page to handle the new API response shape containing multiple risk profiles.
- [ ] `[SCOPE-020]` Redesign the results page to display multiple risk profiles. Use a `Tabs` or `Accordion` component from `shadcn/ui` to organize the results clearly.
- [ ] `[SCOPE-021]` Create a new reusable component, e.g., `<RiskProfileCard />`, to display the details of a single risk profile to avoid code duplication.
- [ ] `[SCOPE-022]` Update the "Recommendations" section to display synthesized advice from the AI that may cover multiple conditions.

### **Process & Documentation**
- [ ] `[SCOPE-023]` [Docs] Research and document the specific, validated risk model being used as the basis for the Lung Cancer module's logic.
- [ ] `[SCOPE-024]` [Process] Formal review and sign-off from a medical advisor for the new lung cancer questions and risk logic.

### **Testing & QA**
- [ ] `[SCOPE-025]` Update E2E tests (`e2e/assessment.spec.ts`) to include the new lung cancer questions and verify that multiple risk cards appear on the results page.
- [ ] `[SCOPE-026]` [QA] Benchmark the API response time again after adding the Lung Cancer module to check for performance degradation.

---

## Epic 3: Add Cardiovascular Disease Module & Polish

**Goal:** Add a non-cancer condition to demonstrate broader applicability and refine the user experience by providing a synthesized summary.

### **Questionnaire & Configuration**
- [ ] `[SCOPE-027]` Add new cardiovascular disease-specific questions to the questionnaire (e.g., about diabetes, known blood pressure).
- [ ] `[SCOPE-028]` [UI] Design and implement a clear UI pattern for any new optional questions (e.g., a "Skip" button or "(Optional)" text).
- [ ] `[SCOPE-029]` Add a `CARDIOVASCULAR_V1` model definition to the `risk-model-config.json`.

### **AI Prompt & Frontend UI Enhancement**
- [ ] `[SCOPE-030]` Refine the `getMultiRiskAssessmentPrompt`. Explicitly instruct the AI to provide a high-level `overallSummary` and to identify how a single user answer (like smoking) impacts multiple risk profiles.
- [ ] `[SCOPE-031]` [UI] Add an "Overall Summary" section at the top of the `results/page.tsx` to display the new `overallSummary` field from the AI response.

### **Export Functionality & Compliance**
- [ ] `[SCOPE-032]` Update `generateAssessmentPdf` in `src/lib/utils/pdf-generator.ts` to render the new multi-profile structure, including the overall summary.
- [ ] `[SCOPE-033]` Update the HTML template in `src/lib/services/email.service.ts` to correctly format the email export for multiple conditions.
- [ ] `[SCOPE-034]` [Content] Update the `Terms of Service` and `Privacy Policy` pages to reflect the assessment of multiple, specific health conditions.
- [ ] `[SCOPE-035]` [UI] Review and update all user-facing disclaimers (on the homepage, results page, and in exports) to be accurate for the newly added conditions.

### **Process & Documentation**
- [ ] `[SCOPE-036]` [Docs] Research and document the scientific basis (e.g., "Framingham Risk Score") for the Cardiovascular Disease module.
- [ ] `[SCOPE-037]` [Process] Formal medical advisor sign-off for the new cardiovascular questions and risk logic.

### **Testing & QA**
- [ ] `[SCOPE-038]` Expand E2E tests to cover the full cardiovascular assessment flow and check the PDF/email export functionality.
- [ ] `[SCOPE-039]` [QA] Final benchmark of the API response time with all three models active.
- [x] implement epic 1 
```