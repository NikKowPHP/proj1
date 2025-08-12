/** @jest-environment node */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    suggestedTopic: {
      findMany: jest.fn(),
    },
  },
}));

const mockedCreateClient = createClient as jest.Mock;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("API Route: /api/user/suggested-topics", () => {
  const mockUser = { id: "user-123" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
  });

  it("fetches and formats topics correctly", async () => {
    // Arrange
    const mockTopicsFromDb = [
      { title: "My favorite food" },
      { title: "A recent trip" },
    ];
    (mockedPrisma.suggestedTopic.findMany as jest.Mock).mockResolvedValue(
      mockTopicsFromDb,
    );

    const request = new NextRequest(
      "http://localhost/api/user/suggested-topics?targetLanguage=spanish",
    );

    // Act
    const response = await GET(request);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockedPrisma.suggestedTopic.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        targetLanguage: "spanish",
      },
      select: {
        title: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    expect(responseBody).toEqual({
      topics: ["My favorite food", "A recent trip"],
    });
  });

  it("returns an empty array when no topics are found", async () => {
    // Arrange
    (mockedPrisma.suggestedTopic.findMany as jest.Mock).mockResolvedValue([]);
    const request = new NextRequest(
      "http://localhost/api/user/suggested-topics?targetLanguage=spanish",
    );

    // Act
    const response = await GET(request);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ topics: [] });
  });

  it("returns 401 if user is not authenticated", async () => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    const request = new NextRequest(
      "http://localhost/api/user/suggested-topics?targetLanguage=spanish",
    );
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 if targetLanguage is missing", async () => {
    const request = new NextRequest(
      "http://localhost/api/user/suggested-topics",
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
