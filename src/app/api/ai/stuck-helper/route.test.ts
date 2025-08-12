/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock("@/lib/ai");
jest.mock("@/lib/rateLimiter");
jest.mock("@/lib/logger");

const mockedCreateClient = createClient as jest.Mock;
const mockedGetAIService = getAIService as jest.Mock;
const mockedTieredRateLimiter = tieredRateLimiter as jest.Mock;

describe("API Route: /api/ai/stuck-helper", () => {
  // A helper to create mock NextRequest objects
  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest("http://localhost/api/ai/stuck-helper", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const mockGetUser = (user: any) => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user } }),
      },
    });
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockClear();
    mockedTieredRateLimiter.mockReturnValue({ allowed: true });
  });

  describe("Happy Path (200 OK)", () => {
    it("should return suggestions for a valid request", async () => {
      // Arrange
      const mockUser = { id: "user-123" };
      const mockDbUser = { subscriptionTier: "FREE" };
      const mockSuggestions = {
        suggestions: ["What happened next?", "How did you feel?"],
      };
      const requestBody = {
        topic: "My Vacation",
        currentText: "I went to the beach.",
        targetLanguage: "english",
      };

      mockGetUser(mockUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      mockedGetAIService.mockReturnValue({
        generateStuckWriterSuggestions: jest
          .fn()
          .mockResolvedValue({ result: mockSuggestions }),
      } as any);

      const request = createMockRequest(requestBody);

      // Act
      const response = await POST(request);
      const responseBody = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseBody).toEqual(mockSuggestions);
      expect(
        getAIService().generateStuckWriterSuggestions,
      ).toHaveBeenCalledWith(requestBody, mockUser.id);
    });
  });

  describe("Unauthorized (401)", () => {
    it("should return 401 if the user is not authenticated", async () => {
      // Arrange
      mockGetUser(null); // No user
      const request = createMockRequest({});

      // Act
      const response = await POST(request);
      const responseBody = await response.text();

      // Assert
      expect(response.status).toBe(401);
      expect(responseBody).toBe("Unauthorized");
    });
  });

  describe("Bad Request (400)", () => {
    it("should return 400 if the request body is invalid", async () => {
      // Arrange
      const mockUser = { id: "user-123" };
      mockGetUser(mockUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        subscriptionTier: "FREE",
      });

      // Missing 'topic' field
      const invalidRequestBody = {
        currentText: "Some text",
        targetLanguage: "english",
      };
      const request = createMockRequest(invalidRequestBody);

      // Act
      const response = await POST(request);
      const responseBody = await response.text();

      // Assert
      expect(response.status).toBe(400);
      expect(responseBody).toBe("Invalid request body");
    });
  });
});