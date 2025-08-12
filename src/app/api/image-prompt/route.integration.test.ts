/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import axios from "axios";
import { getAIService } from "@/lib/ai";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("axios");
jest.mock("posthog-node");
jest.mock("@/lib/db", () => ({
  __esModule: true,
  prisma: {
    topic: {
      upsert: jest.fn(),
    },
  },
}));
jest.mock("@/lib/ai");

const mockedCreateClient = createClient as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedGetAIService = getAIService as jest.Mock;

describe("API Route: /api/image-prompt", () => {
  const mockUser = { id: "user-123" };
  const createMockRequest = (body: any) =>
    new NextRequest("http://localhost/api/image-prompt", {
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
    // Mock the AI service to prevent real API calls and control the output
    mockedGetAIService.mockReturnValue({
      generateImageDescription: jest
        .fn()
        .mockResolvedValue({ result: "a serene lake at sunset" }),
    });
  });

  it("should generate a topic with an image and type 'IMAGE'", async () => {
    // Arrange
    const mockUnsplashResponse = {
      data: [
        {
          urls: { regular: "https://image.url/regular" },
          user: { name: "Photographer" },
          // This description from Unsplash is ignored; the title comes from our AI service
          alt_description: "This description is not used",
        },
      ],
    };
    mockedAxios.get.mockResolvedValue(mockUnsplashResponse);

    const mockTopic = {
      id: "topic-1",
      title: "a serene lake at sunset", // This must match the mocked AI response
      imageUrl: "https://image.url/regular",
      type: "IMAGE",
    };
    (mockedPrisma.topic.upsert as jest.Mock).mockResolvedValue(mockTopic);

    const request = createMockRequest({ targetLanguage: "spanish" });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);

    // Verify the AI service was called
    expect(mockedGetAIService().generateImageDescription).toHaveBeenCalledWith(
      mockUser.id,
    );

    // Verify Unsplash was called with the description from our AI service
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.unsplash.com/photos/random",
      expect.objectContaining({
        params: expect.objectContaining({
          query: "a serene lake at sunset",
        }),
      }),
    );

    // Verify the database was updated with the correct data
    expect(mockedPrisma.topic.upsert).toHaveBeenCalledWith({
      where: {
        userId_title_targetLanguage: {
          userId: mockUser.id,
          title: "a serene lake at sunset",
          targetLanguage: "spanish",
        },
      },
      update: {},
      create: {
        userId: mockUser.id,
        title: "a serene lake at sunset",
        targetLanguage: "spanish",
        imageUrl: "https://image.url/regular",
        type: "IMAGE",
      },
    });
    expect(body).toEqual(mockTopic);
  });
});