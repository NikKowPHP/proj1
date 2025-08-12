/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { encrypt } from "@/lib/encryption";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    user: { findUnique: jest.fn() },
    practiceAttempt: { create: jest.fn() },
  },
}));
jest.mock("@/lib/ai");
jest.mock("@/lib/rateLimiter");
jest.mock("@/lib/encryption");

const mockedCreateClient = createClient as jest.Mock;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedGetAIService = getAIService as jest.Mock;
const mockedTieredRateLimiter = tieredRateLimiter as jest.Mock;
const mockedEncrypt = encrypt as jest.Mock;

const mockUser = { id: "user-123" };
const mockEvaluateDrillDown = jest.fn();

const createMockRequest = (body: any) =>
  new NextRequest("http://localhost/api/ai/evaluate-drill-down", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("API Route: /api/ai/evaluate-drill-down", () => {
  const validRequestBody = {
    mistakeId: "mistake-1",
    taskPrompt: "Translate: 'Hola'",
    expectedAnswer: "Hello",
    userAnswer: "Hi",
    targetLanguage: "english",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      nativeLanguage: "english",
      subscriptionTier: "PRO",
    });
    mockedGetAIService.mockReturnValue({
      evaluateDrillDownAnswer: mockEvaluateDrillDown,
    } as any);
    mockedTieredRateLimiter.mockReturnValue({ allowed: true });
    mockedEncrypt.mockImplementation((text) => `encrypted(${text})`);
  });

  it("should evaluate answer, save attempt, and return result on valid request", async () => {
    const mockEvaluation = {
      isCorrect: true,
      score: 90,
      feedback: "Good job!",
      correctedAnswer: "Hello",
    };
    mockEvaluateDrillDown.mockResolvedValue({ result: mockEvaluation });

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockEvaluation);

    expect(mockEvaluateDrillDown).toHaveBeenCalledWith({
      ...validRequestBody,
      nativeLanguage: "english",
    });

    expect(mockedPrisma.practiceAttempt.create).toHaveBeenCalledWith({
      data: {
        mistakeId: validRequestBody.mistakeId,
        userId: mockUser.id,
        taskPrompt: validRequestBody.taskPrompt,
        expectedAnswer: validRequestBody.expectedAnswer,
        userAnswer: validRequestBody.userAnswer,
        aiEvaluationJson: `encrypted(${JSON.stringify(mockEvaluation)})`,
        isCorrect: mockEvaluation.isCorrect,
        score: mockEvaluation.score,
      },
    });
  });

  it("should return 401 Unauthorized if no user is found", async () => {
    mockedCreateClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const request = createMockRequest({});
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 Bad Request for an invalid request body", async () => {
    const request = createMockRequest({ mistakeId: "mistake-1" }); // Missing fields
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 429 Too Many Requests if rate limited", async () => {
    mockedTieredRateLimiter.mockReturnValue({ allowed: false });
    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it("should return 500 Internal Server Error if the AI service fails", async () => {
    mockEvaluateDrillDown.mockRejectedValue(new Error("AI service down"));
    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});