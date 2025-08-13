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
    overallSummary: "Summary",
    modelAssessments: [],
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
  
  const validUserAnswers = {
    age: "60+",
    sex: "Male",
    units: "metric",
    height: "180",
    weight: "90",
    smoking_status: "Current smoker",
  } as const;

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
    userAnswers: validUserAnswers,
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
    const req = createRequest({
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: { answers: validUserAnswers },
    });

    const response = await POST(req as any);
    const responseJson = await response.json();

    // 1. Assert risk calculator was called with user answers
    expect(mockedCalculateAllRisks).toHaveBeenCalledTimes(1);
    expect(mockedCalculateAllRisks).toHaveBeenCalledWith(validUserAnswers, "en");

    // 2. Assert AI service was called with the result of the calculation
    expect(mockAIService.getRiskAssessmentExplanation).toHaveBeenCalledTimes(1);
    expect(mockAIService.getRiskAssessmentExplanation).toHaveBeenCalledWith(
      mockCalculationResult,
      undefined,
      "en",
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
      // This payload will pass the first validation but fail the stricter answersSchema validation
      body: { answers: { units: 'metric', height: 'abc', weight: '123' } },
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

    const req = createRequest({
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: { answers: validUserAnswers },
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
