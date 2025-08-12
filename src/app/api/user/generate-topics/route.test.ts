/** @jest-environment node */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    languageProfile: {
      findUnique: jest.fn(),
    },
    suggestedTopic: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));
jest.mock("@/lib/ai");

const mockedCreateClient = createClient as jest.Mock;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedGetAIService = getAIService as jest.Mock;

describe("API Route: /api/user/generate-topics", () => {
  const mockUser = { id: "user-123" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    // Mock the transaction to just execute the callback
    mockedPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockedPrisma);
    });
  });

  it("verifies the atomic replacement of topics", async () => {
    // Arrange
    const generatedTopics = ["Topic 1", "Topic 2"];
    const mockLanguageProfile = { aiAssessedProficiency: 50 };

    (mockedPrisma.languageProfile.findUnique as jest.Mock).mockResolvedValue(
      mockLanguageProfile,
    );
    mockedGetAIService.mockReturnValue({
      generateTopics: jest.fn().mockResolvedValue({ result: generatedTopics }),
    } as any);

    const request = new NextRequest(
      "http://localhost/api/user/generate-topics?targetLanguage=spanish",
    );

    // Act
    await GET(request);

    // Assert
    // Check that transaction was called
    expect(mockedPrisma.$transaction).toHaveBeenCalledTimes(1);

    // Check that deleteMany was called first
    expect(mockedPrisma.suggestedTopic.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        targetLanguage: "spanish",
      },
    });

    // Check that createMany was called second with correct data
    expect(mockedPrisma.suggestedTopic.createMany).toHaveBeenCalledWith({
      data: generatedTopics.map((title) => ({
        userId: mockUser.id,
        title,
        targetLanguage: "spanish",
      })),
      skipDuplicates: true,
    });

    // Ensure the order of operations by checking the mock call order
    const deleteOrder = (mockedPrisma.suggestedTopic.deleteMany as jest.Mock)
      .mock.invocationCallOrder[0];
    const createOrder = (mockedPrisma.suggestedTopic.createMany as jest.Mock)
      .mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(createOrder);
  });

  it("returns 401 if user is not authenticated", async () => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    const request = new NextRequest(
      "http://localhost/api/user/generate-topics?targetLanguage=spanish",
    );
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 if targetLanguage is missing", async () => {
    const request = new NextRequest(
      "http://localhost/api/user/generate-topics",
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});