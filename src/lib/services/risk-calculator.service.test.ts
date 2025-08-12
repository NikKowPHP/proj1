/** @jest-environment node */

import { calculateRisk } from "./risk-calculator.service";
import type { CalculationResult } from "../types";

describe("Risk Calculator Service", () => {
  // --- Test Case 1: High-Risk User ---
  it("should correctly identify a high-risk user", () => {
    const highRiskAnswers = {
      age: "60+",
      sex: "Male",
      smoking: "Yes",
      alcohol: "15+",
      activity: "0 days",
      diet: "0-1",
    };
    const result: CalculationResult = calculateRisk(highRiskAnswers);

    // Assertions for risk factors
    const smokingRisk = result.riskFactors.find(f => f.id === "SMOKING_RELATED");
    expect(smokingRisk?.level).toBe("High");
    expect(smokingRisk?.score).toBe(10);

    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.level).toBe("High");
    expect(lifestyleRisk?.score).toBe(17); // 7 (alcohol) + 5 (activity) + 5 (diet)

    const demographicRisk = result.riskFactors.find(f => f.id === "DEMOGRAPHIC");
    expect(demographicRisk?.level).toBe("High");
    expect(demographicRisk?.score).toBe(9); // 8 (age) + 1 (sex)

    // Assertions for positive factors (should be none)
    expect(result.positiveFactors).toHaveLength(0);
  });

  // --- Test Case 2: Low-Risk User ---
  it("should correctly identify a low-risk user", () => {
    const lowRiskAnswers = {
      age: "18-29",
      sex: "Female",
      smoking: "No",
      alcohol: "None",
      activity: "5+ days",
      diet: "6+",
    };
    const result: CalculationResult = calculateRisk(lowRiskAnswers);

    // Assertions for risk factors
    const smokingRisk = result.riskFactors.find(f => f.id === "SMOKING_RELATED");
    expect(smokingRisk?.level).toBe("Low");

    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.level).toBe("Low");
    expect(lifestyleRisk?.score).toBe(-4); // 0 (alcohol) - 2 (activity) - 2 (diet)

    const demographicRisk = result.riskFactors.find(f => f.id === "DEMOGRAPHIC");
    expect(demographicRisk?.level).toBe("Low");

    // Assertions for positive factors
    expect(result.positiveFactors).toHaveLength(3);
    expect(result.positiveFactors.some(f => f.id === "EXERCISE")).toBe(true);
    expect(result.positiveFactors.some(f => f.id === "HEALTHY_DIET")).toBe(true);
    expect(result.positiveFactors.some(f => f.id === "NON_SMOKER")).toBe(true);
  });
  
  // --- Test Case 3: Average-Risk User ---
  it("should correctly identify an average-risk user", () => {
    const averageRiskAnswers = {
      age: "40-49",
      sex: "Female",
      smoking: "No",
      alcohol: "3-7",
      activity: "1-2 days",
      diet: "2-3",
    };
    const result: CalculationResult = calculateRisk(averageRiskAnswers);

    // Assertions for risk factors
    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.level).toBe("Average");
    expect(lifestyleRisk?.score).toBe(8); // 3 (alcohol) + 3 (activity) + 2 (diet)

    const demographicRisk = result.riskFactors.find(f => f.id === "DEMOGRAPHIC");
    expect(demographicRisk?.level).toBe("Low");
    expect(demographicRisk?.score).toBe(4); // 4 (age) + 0 (sex)
    
    // Assertions for positive factors
    expect(result.positiveFactors.some(f => f.id === "NON_SMOKER")).toBe(true);
    expect(result.positiveFactors.some(f => f.id === "EXERCISE")).toBe(false);
  });

  // --- Test Case 4: Edge Case with Missing Answers ---
  it("should handle missing answers gracefully", () => {
    const partialAnswers = {
      age: "50-59",
      smoking: "Yes",
    };
    const result: CalculationResult = calculateRisk(partialAnswers);

    const smokingRisk = result.riskFactors.find(f => f.id === "SMOKING_RELATED");
    expect(smokingRisk?.level).toBe("High");
    expect(smokingRisk?.score).toBe(10);
    
    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.level).toBe("Low");
    expect(lifestyleRisk?.score).toBe(0); // All answers missing, score is 0
  });
});