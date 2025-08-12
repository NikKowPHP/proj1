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
    user: { findUnique: jest.fn() },
  },
}));
jest.mock("@/lib/ai");
jest.mock("@/lib/rateLimiter");

const mockedCreateClient = createClient as jest.Mock;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedGetAIService = getAIService as jest.Mock;
const mockedTieredRateLimiter = tieredRateLimiter as jest.Mock;

const mockUser = { id: "user-123" };
const mockGenerateReadingTasks = jest.fn();

const createMockRequest = (body: any) =>
  new NextRequest("http://localhost/api/ai/reading-task", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("API Route: /api/ai/reading-task", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      subscriptionTier: "PRO",
    });
    mockedGetAIService.mockReturnValue({
      generateReadingTasks: mockGenerateReadingTasks,
    } as any);
    mockedTieredRateLimiter.mockReturnValue({ allowed: true });
  });

  it("should return structured tasks for a valid request", async () => {
    const requestBody = {
      content: "A story.",
      targetLanguage: "spanish",
      level: "BEGINNER",
    };
    const mockResponse = {
      summary: { title: "Resumen", prompt: "Resume la historia." },
      comprehension: { title: "Comprensión", prompt: "¿Qué pasó?" },
      creative: { title: "Creativo", prompt: "Escribe un final alternativo." },
    };
    mockGenerateReadingTasks.mockResolvedValue({ result: mockResponse });

    const request = createMockRequest(requestBody);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockResponse);
    expect(mockGenerateReadingTasks).toHaveBeenCalledWith(
      requestBody.content,
      requestBody.targetLanguage,
      requestBody.level,
      mockUser.id,
    );
  });

  it("should return 502 Bad Gateway for a malformed AI response", async () => {
    const requestBody = {
      content: "A story.",
      targetLanguage: "spanish",
      level: "BEGINNER",
    };
    const malformedResponse = {
      summary: { title: "Resumen" }, // Missing 'prompt'
    };
    mockGenerateReadingTasks.mockResolvedValue({ result: malformedResponse });

    const request = createMockRequest(requestBody);
    const response = await POST(request);

    expect(response.status).toBe(502);
    expect(await response.text()).toContain("AI response malformed");
  });

  it("should return 400 for an invalid request body", async () => {
    const request = createMockRequest({ content: "short" }); // Missing fields
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should return 429 when rate limited", async () => {
    mockedTieredRateLimiter.mockReturnValue({ allowed: false });
    const request = createMockRequest({
      content: "A story.",
      targetLanguage: "spanish",
      level: "BEGINNER",
    });
    const response = await POST(request);
    expect(response.status).toBe(429);
  });
});