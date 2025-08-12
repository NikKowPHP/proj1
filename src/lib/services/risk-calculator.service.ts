import type {
  CalculationResult,
  CalculatedRiskFactor,
  IdentifiedPositiveFactor,
  CalculatedRiskLevel,
} from "@/lib/types";
import riskConfig from "@/lib/risk-model-config.json";

type Answers = Record<string, string>;

/**
 * Determines the risk level based on a score and predefined thresholds.
 * @param score The calculated score for a risk factor.
 * @param thresholds The 'average' and 'high' score thresholds.
 * @returns The calculated risk level.
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
 * Calculates a user's health risks based on their answers to a questionnaire.
 * This function uses a deterministic model defined in `risk-model-config.json`.
 *
 * @param answers A record of question IDs and the user's corresponding answers.
 * @returns A `CalculationResult` object containing calculated risk factors and identified positive factors.
 */
export function calculateRisk(answers: Answers): CalculationResult {
  const calculatedFactors: CalculatedRiskFactor[] = [];
  const positiveFactors: IdentifiedPositiveFactor[] = [];
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
      // Assuming height is in inches and weight is in pounds for imperial
      heightInMeters = height * 0.0254;
      weightInKg = weight * 0.453592;
    } else {
      // Assuming height is in cm and weight is in kg for metric
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

  // 1. Calculate scores for each risk factor category
  for (const factorId in riskConfig.factors) {
    const factorInfo =
      riskConfig.factors[factorId as keyof typeof riskConfig.factors];
    let score = 0;

    for (const questionId of factorInfo.questionIds) {
      const answer = processedAnswers[questionId];
      if (answer) {
        const questionWeights =
          riskConfig.weights[questionId as keyof typeof riskConfig.weights];
        score += questionWeights[answer as keyof typeof questionWeights] ?? 0;
      }
    }

    calculatedFactors.push({
      id: factorId,
      name: factorInfo.name,
      score: score,
      level: getRiskLevel(score, factorInfo.thresholds),
    });
  }

  // 2. Identify positive lifestyle factors
  for (const factorId in riskConfig.positiveFactors) {
    const positiveFactorInfo =
      riskConfig.positiveFactors[
        factorId as keyof typeof riskConfig.positiveFactors
      ];
    const triggerAnswer =
      processedAnswers[positiveFactorInfo.trigger.questionId];

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

  return {
    riskFactors: calculatedFactors,
    positiveFactors: positiveFactors,
    userAnswers: answers, // Return original answers for AI context
  };
}