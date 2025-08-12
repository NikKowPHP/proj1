/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    topic: {
      upsert: jest.fn(),
    },
    journalEntry: {
      create: jest.fn(),
    },
    suggestedTopic: {
      deleteMany: jest.fn(),
    },
    systemSetting: {
      findUnique: jest.fn(),
    },
  },
  // Add Prisma namespace for JsonNull
  Prisma: {
    JsonNull: "JsonNull",
  },
}));

const mockedCreateClient = createClient as jest.Mock;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("API Route: POST /api/journal", () => {
  const mockUser = { id: "user-123" };

  const createMockRequest = (body: any) =>
    new NextRequest("http://localhost/api/journal", {
      method: "POST",
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (mockedPrisma.systemSetting.findUnique as jest.Mock).mockResolvedValue({
      key: "journalMinChars",
      value: { value: 50 },
    });
    (mockedPrisma.topic.upsert as jest.Mock).mockResolvedValue({
      id: "topic-123",
      userId: mockUser.id,
      title: "Test Topic",
      targetLanguage: "spanish",
      isMastered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (mockedPrisma.journalEntry.create as jest.Mock).mockResolvedValue({
      id: "journal-456",
      authorId: mockUser.id,
      topicId: "topic-123",
      content: "test",
      targetLanguage: "spanish",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("deletes a suggested topic when a specific topicTitle is used", async () => {
    // Arrange
    const requestBody = {
      content:
        "This is a test journal entry that is definitely long enough to pass validation.",
      topicTitle: "My favorite food",
      targetLanguage: "spanish",
    };
    const request = createMockRequest(requestBody);

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(201);
    expect(mockedPrisma.suggestedTopic.deleteMany).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.suggestedTopic.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        title: "My favorite food",
        targetLanguage: "spanish",
      },
    });
  });

  it('does not delete a suggested topic when the topicTitle is "Free Write"', async () => {
    // Arrange
    const requestBody = {
      content:
        "This is a free write entry that is definitely over fifty characters long.",
      topicTitle: "Free Write",
      targetLanguage: "spanish",
    };
    const request = createMockRequest(requestBody);

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(201);
    expect(mockedPrisma.suggestedTopic.deleteMany).not.toHaveBeenCalled();
  });

  it('does not delete a suggested topic when topicTitle is not provided (defaults to "Free Write")', async () => {
    // Arrange
    const requestBody = {
      content:
        "This is another free write entry that is also over fifty characters long.",
      targetLanguage: "spanish",
    };
    const request = createMockRequest(requestBody);

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(201);
    expect(mockedPrisma.suggestedTopic.deleteMany).not.toHaveBeenCalled();
  });

  it("should return 400 Bad Request if content is less than 50 characters", async () => {
    // Arrange
    const requestBody = {
      content: "This is too short.",
      topicTitle: "Short content test",
      targetLanguage: "spanish",
    };
    const request = createMockRequest(requestBody);

    // Act
    const response = await POST(request);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(mockedPrisma.journalEntry.create).not.toHaveBeenCalled();
    expect(responseBody.error).toBeDefined();
    // Check for Zod's error structure
    expect(responseBody.error.issues[0].message).toBe(
      "Journal entry must be at least 50 characters long.",
    );
  });

  it("should return 201 Created if content is 50 characters or more", async () => {
    // Arrange
    const longContent =
      "This is a sufficiently long journal entry that should definitely pass the fifty character minimum requirement for this test.";
    const requestBody = {
      content: longContent,
      topicTitle: "Long content test",
      targetLanguage: "spanish",
    };
    const request = createMockRequest(requestBody);

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(201);
    expect(mockedPrisma.journalEntry.create).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.journalEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        content: expect.any(String), // it will be encrypted
      }),
    });
  });

  it("should correctly store aidsUsage data when provided", async () => {
    const aidsUsage = [
      {
        type: "translator_dialog_apply" as const,
        details: { text: "hola", timestamp: new Date().toISOString() },
      },
    ];
    const requestBody = {
      content: "A long enough sentence with aids usage data for testing.",
      topicTitle: "Aids Usage Test",
      targetLanguage: "spanish",
      aidsUsage,
    };
    const request = createMockRequest(requestBody);

    await POST(request);

    expect(mockedPrisma.journalEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ aidsUsage }),
    });
  });

  it("should store JsonNull for aidsUsage when it is not provided", async () => {
    const requestBody = {
      content: "A long enough sentence without aids usage data for testing.",
      topicTitle: "No Aids Usage Test",
      targetLanguage: "spanish",
    };
    const request = createMockRequest(requestBody);

    await POST(request);

    expect(mockedPrisma.journalEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ aidsUsage: Prisma.JsonNull }),
    });
  });

  it("should return 400 for malformed aidsUsage data", async () => {
    const requestBody = {
      content: "A long enough sentence with malformed aids usage.",
      topicTitle: "Malformed Aids",
      targetLanguage: "spanish",
      aidsUsage: { not: "an array" }, // Malformed data
    };
    const request = createMockRequest(requestBody);

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});