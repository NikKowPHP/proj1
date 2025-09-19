/** @jest-environment node */

import { POST } from "./route";
import * as guidelineEngine from "@/lib/services/guideline-engine.service";
import * as ai from "@/lib/ai";
import { GuidelinePlan, ActionPlan } from "@/lib/types";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/services/guideline-engine.service");
jest.mock("@/lib/ai");

const mockedGeneratePlan = guidelineEngine.generatePlan as jest.Mock;
const mockedGetAIService = ai.getAIService as jest.Mock;

describe("POST /api/assess", () => {
  const mockAIExplanation: ActionPlan = {
    overallSummary: "Summary",
    recommendedScreenings: [
      { id: "TEST", title: "Test Screening", description: "...", why: "..." },
    ],
    lifestyleGuidelines: [],
    topicsForDoctor: [],
  };

  const validUserAnswers = {
    age: "50-59",
    sex: "Male",
    units: "metric",
    height: "180",
    weight: "90",
    smoking_status: "Current smoker",
  } as const;

  const mockGuidelineResult: GuidelinePlan = {
    screenings: ["TEST_SCREENING"],
    lifestyle: [],
    topicsForDoctor: [],
    userAnswers: validUserAnswers,
  };

  const mockAIService = {
    getPlanExplanation: jest.fn().mockResolvedValue({
      result: mockAIExplanation,
      serviceUsed: "mock-ai",
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAIService.mockReturnValue(mockAIService);
    mockedGeneratePlan.mockReturnValue(mockGuidelineResult);
  });

  it("should orchestrate the new guideline flow correctly", async () => {
    const requestBody = { answers: validUserAnswers };
    const req = new NextRequest("http://localhost/api/assess", {
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    const responseJson = await response.json();

    // 1. Assert guideline engine was called with user answers
    expect(mockedGeneratePlan).toHaveBeenCalledTimes(1);
    
    // We can't easily check the derived variables here, so we check the static parts
    expect(mockedGeneratePlan).toHaveBeenCalledWith(validUserAnswers, expect.any(Object), "en");

    // 2. Assert AI service was called with the result of the guideline engine
    expect(mockAIService.getPlanExplanation).toHaveBeenCalledTimes(1);
    expect(mockAIService.getPlanExplanation).toHaveBeenCalledWith(
      expect.objectContaining({ guideline_plan: mockGuidelineResult }),
      undefined,
      "en",
    );

    // 3. Assert the final response is the AI-generated ActionPlan
    expect(response.status).toBe(200);
    expect(responseJson).toEqual(mockAIExplanation);
  });

  it("should return 400 for invalid request format", async () => {
    const requestBody = { wrong_key: "some value" }; // Missing 'answers'
    const req = new NextRequest("http://localhost/api/assess", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    const responseJson = await response.json();

    expect(response.status).toBe(400);
    expect(responseJson.error).toBe("Invalid request format");
    expect(mockedGeneratePlan).not.toHaveBeenCalled();
    expect(mockAIService.getPlanExplanation).not.toHaveBeenCalled();
  });

  it("should return 502 if AI response validation fails", async () => {
    // Mock AI to return an invalid response
    mockAIService.getPlanExplanation.mockResolvedValueOnce({
      result: { bad: "data" }, // Invalid structure
      serviceUsed: "mock-ai",
    });

    const requestBody = { answers: validUserAnswers };
    const req = new NextRequest("http://localhost/api/assess", {
      method: "POST",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    const responseJson = await response.json();

    expect(response.status).toBe(502);
    expect(responseJson).toEqual({
      error: "Failed to process plan due to invalid AI response",
    });
  });
});
      