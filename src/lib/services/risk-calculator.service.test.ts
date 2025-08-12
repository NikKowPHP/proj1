/** @jest-environment node */

import { calculateRisk } from "./risk-calculator.service";
import type { CalculationResult } from "../types";

describe("Risk Calculator Service (v2)", () => {
  // --- Test Case 1: High-Risk User with Metric Units ---
  it("should correctly identify a high-risk user with metric units", () => {
    const highRiskAnswers = {
      units: "metric",
      height: "175", // cm
      weight: "100", // kg
      age: "60+",
      sex: "Male",
      smoking_status: "Current smoker",
      alcohol: "15+",
      activity: "0 days",
      diet_fruits_veg: "0-1",
      diet_red_meat: "5+ times",
      family_history_cancer: "Yes",
    };
    const result: CalculationResult = calculateRisk(highRiskAnswers);

    // BMI for 100kg / 1.75m^2 is ~32.65 (Obese)
    const bodyCompRisk = result.riskFactors.find(f => f.id === "BODY_COMPOSITION");
    expect(bodyCompRisk?.level).toBe("High");
    expect(bodyCompRisk?.score).toBe(8);

    const geneticRisk = result.riskFactors.find(f => f.id === "GENETIC_PREDISPOSITION");
    expect(geneticRisk?.level).toBe("High");
    expect(geneticRisk?.score).toBe(10);
    
    const smokingRisk = result.riskFactors.find(f => f.id === "SMOKING_RELATED");
    expect(smokingRisk?.level).toBe("High");
    expect(smokingRisk?.score).toBe(10);
    
    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.level).toBe("High");
    expect(lifestyleRisk?.score).toBe(7 + 5 + 5 + 6); // alcohol + activity + fruits/veg + red meat

    expect(result.positiveFactors).toHaveLength(0);
  });

  // --- Test Case 2: Low-Risk User with Metric Units ---
  it("should correctly identify a low-risk user", () => {
    const lowRiskAnswers = {
      units: "metric",
      height: "170",
      weight: "65",
      age: "18-29",
      sex: "Female",
      smoking_status: "Never smoked",
      alcohol: "None",
      activity: "5+ days",
      diet_fruits_veg: "6+",
      diet_red_meat: "Never or rarely",
      family_history_cancer: "No",
    };
    const result: CalculationResult = calculateRisk(lowRiskAnswers);

    // BMI for 65kg / 1.7m^2 is ~22.49 (Normal)
    const bodyCompRisk = result.riskFactors.find(f => f.id === "BODY_COMPOSITION");
    expect(bodyCompRisk?.level).toBe("Low");
    expect(bodyCompRisk?.score).toBe(0);

    const geneticRisk = result.riskFactors.find(f => f.id === "GENETIC_PREDISPOSITION");
    expect(geneticRisk?.level).toBe("Low");
    expect(geneticRisk?.score).toBe(0);

    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.level).toBe("Low");
    expect(lifestyleRisk?.score).toBe(-4); // 0 + (-2) + (-2) + 0

    // Assertions for positive factors
    expect(result.positiveFactors).toHaveLength(3);
    expect(result.positiveFactors.some(f => f.id === "NON_SMOKER")).toBe(true);
    expect(result.positiveFactors.some(f => f.id === "EXERCISE")).toBe(true);
    expect(result.positiveFactors.some(f => f.id === "HEALTHY_DIET")).toBe(true);
  });
  
  // --- Test Case 3: Average-Risk User with Imperial Units ---
  it("should correctly calculate BMI and risk for an average user with imperial units", () => {
    const averageRiskAnswers = {
      units: "imperial",
      height: "70", // inches
      weight: "180", // lbs
      age: "40-49",
      sex: "Male",
      smoking_status: "Former smoker",
      alcohol: "3-7",
      activity: "1-2 days",
      diet_fruits_veg: "2-3",
      diet_red_meat: "1-2 times",
      family_history_cancer: "I don't know",
    };
    const result: CalculationResult = calculateRisk(averageRiskAnswers);

    // BMI for 180lbs / 70in is ~25.8 (Overweight)
    const bodyCompRisk = result.riskFactors.find(f => f.id === "BODY_COMPOSITION");
    expect(bodyCompRisk?.level).toBe("Average");
    expect(bodyCompRisk?.score).toBe(4);

    const geneticRisk = result.riskFactors.find(f => f.id === "GENETIC_PREDISPOSITION");
    expect(geneticRisk?.level).toBe("Average");
    expect(geneticRisk?.score).toBe(2);

    const smokingRisk = result.riskFactors.find(f => f.id === "SMOKING_RELATED");
    expect(smokingRisk?.level).toBe("Average");
    expect(smokingRisk?.score).toBe(3);
    
    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.level).toBe("High");
    expect(lifestyleRisk?.score).toBe(3 + 3 + 2 + 2); // 10

    expect(result.positiveFactors).toHaveLength(0);
  });

  // --- Test Case 4: Edge Case with Missing Answers ---
  it("should handle missing non-essential answers gracefully", () => {
    const partialAnswers = {
      units: "metric",
      height: "180",
      weight: "75",
      age: "50-59",
      smoking_status: "Current smoker",
      // Missing alcohol, activity, diet, family history
    };
    const result: CalculationResult = calculateRisk(partialAnswers);

    // BMI is ~23.1 (Normal)
    const bodyCompRisk = result.riskFactors.find(f => f.id === "BODY_COMPOSITION");
    expect(bodyCompRisk?.level).toBe("Low");

    const smokingRisk = result.riskFactors.find(f => f.id === "SMOKING_RELATED");
    expect(smokingRisk?.level).toBe("High");
    
    // Lifestyle score should be 0 because all its factors are missing
    const lifestyleRisk = result.riskFactors.find(f => f.id === "LIFESTYLE_CHOICES");
    expect(lifestyleRisk?.score).toBe(0);
  });
});