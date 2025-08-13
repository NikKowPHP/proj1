import type {
  MultiCalculationResult,
  ModelResult,
  CalculatedRiskFactor,
  IdentifiedPositiveFactor,
  CalculatedRiskLevel,
} from "@/lib/types";
import riskConfigEn from "@/lib/risk-model-config.en.json";
import riskConfigPl from "@/lib/risk-model-config.pl.json";
import { logger } from "../logger";

// Define the type for the config file to ensure type safety
interface RiskModelConfig {
  models: {
    [modelId: string]: {
      name: string;
      factors: {
        [factorId: string]: {
          name: string;
          questionIds: string[];
          thresholds: { average: number; high: number };
        };
      };
      weights: {
        [questionId: string]: {
          [answer: string]: number;
        };
      };
    };
  };
  positiveFactors: {
    [factorId: string]: {
      name: string;
      description: string;
      trigger: {
        questionId: string;
        answers: string[];
      };
    };
  };
}

const configs: { [key: string]: RiskModelConfig } = {
  en: riskConfigEn as unknown as RiskModelConfig,
  pl: riskConfigPl as unknown as RiskModelConfig,
};

type Answers = Record<string, string>;
type ModelConfig = (typeof configs.en.models)[keyof typeof configs.en.models];

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
  riskConfig: RiskModelConfig,
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
 * @param locale The locale to use for model names and descriptions.
 * @returns A `MultiCalculationResult` object containing results from all models.
 */
export function calculateAllRisks(
  answers: Answers,
  locale: string = "en",
): MultiCalculationResult {
  const riskConfig = configs[locale] || configs.en;
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
  const positiveFactors = identifyPositiveFactors(processedAnswers, riskConfig);

  return {
    modelResults,
    positiveFactors,
    userAnswers: answers, // Return original answers for AI context
  };
}
