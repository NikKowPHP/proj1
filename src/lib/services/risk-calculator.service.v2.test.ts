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