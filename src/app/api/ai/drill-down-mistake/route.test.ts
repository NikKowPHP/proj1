/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    practiceAttempt: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock("@/lib/ai");
jest.mock("@/lib/rateLimiter");

const mockedCreateClient = createClient as jest.Mock;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedGetAIService = getAIService as jest.Mock;
const mockedTieredRateLimiter = tieredRateLimiter as jest.Mock;

const mockUser = { id: "user-123" };
const mockDrillDown = jest.fn();

const createMockRequest = (body: any) =>
  new NextRequest("http://localhost/api/ai/drill-down-mistake", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("API Route: /api/ai/drill-down-mistake", () => {
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
    (mockedPrisma.practiceAttempt.findMany as jest.Mock).mockResolvedValue([]);
    mockedGetAIService.mockReturnValue({
      generateDrillDownExercises: mockDrillDown,
    } as any);
    mockedTieredRateLimiter.mockReturnValue({ allowed: true });
  });

  it("should return practice sentences on a valid request", async () => {
    const requestBody = {
      mistakeId: "mistake-1",
      originalText: "I goed",
      correctedText: "I went",
      explanation: "Verb tense",
      targetLanguage: "english",
    };
    const mockResponse = {
      practiceSentences: [{ task: "Translate", answer: "They go" }],
    };
    mockDrillDown.mockResolvedValue({ result: mockResponse });

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockResponse);
    expect(mockDrillDown).toHaveBeenCalledWith(
      {
        original: requestBody.originalText,
        corrected: requestBody.correctedText,
        explanation: requestBody.explanation,
        targetLanguage: requestBody.targetLanguage,
        nativeLanguage: "english",
        previousAttempts: [],
        existingTasks: undefined,
      },
      mockUser.id,
    );
  });

  it("should return 401 Unauthorized if no user is found", async () => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const request = createMockRequest({});
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 Bad Request for an invalid request body", async () => {
    const invalidBody = { originalText: "I goed" }; // Missing fields
    const request = createMockRequest(invalidBody);
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 429 Too Many Requests if rate limited", async () => {
    mockedTieredRateLimiter.mockReturnValue({ allowed: false });
    const request = createMockRequest({
      mistakeId: "mistake-1",
      originalText: "I goed",
      correctedText: "I went",
      explanation: "Verb tense",
      targetLanguage: "english",
    });
    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it("should return 500 Internal Server Error if the service fails", async () => {
    mockDrillDown.mockRejectedValue(new Error("AI service down"));
    const request = createMockRequest({
      mistakeId: "mistake-1",
      originalText: "I goed",
      correctedText: "I went",
      explanation: "Verb tense",
      targetLanguage: "english",
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});