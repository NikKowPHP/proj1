/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));
jest.mock("@/lib/ai");

const mockedCreateClient = createClient as jest.Mock;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedGetAIService = getAIService as jest.Mock;
const mockEvaluateUserSentence = jest.fn();

const createMockRequest = (body: any) =>
  new NextRequest("http://localhost/api/user/evaluate-sentence", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("API Route: /api/user/evaluate-sentence", () => {
  const mockUser = { id: "user-123" };
  const validRequestBody = {
    sentence: "She went to the park.",
    concept: "The past tense of 'go' is 'went'.",
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
      evaluateUserSentence: mockEvaluateUserSentence,
    } as any);
  });

  it("should successfully evaluate a sentence with a valid request", async () => {
    const mockResponse = { isCorrect: true, feedback: "Correct!" };
    mockEvaluateUserSentence.mockResolvedValue({ result: mockResponse });

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockResponse);
    expect(mockEvaluateUserSentence).toHaveBeenCalledWith({
      ...validRequestBody,
      nativeLanguage: "english",
    });
  });

  it("should return 401 Unauthorized if no user is found", async () => {
    mockedCreateClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 Bad Request for an invalid request body", async () => {
    const request = createMockRequest({ sentence: "test" }); // Missing fields
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});