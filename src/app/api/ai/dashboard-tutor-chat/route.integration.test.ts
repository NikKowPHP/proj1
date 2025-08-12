/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { getUserProficiencySnapshot } from "@/lib/services/analytics.service";
import { User, SrsItemType } from "@prisma/client";
import { encrypt } from "@/lib/encryption";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/ai");
jest.mock("@/lib/services/analytics.service");

const mockedCreateClient = createClient as jest.Mock;
const mockedGetAIService = getAIService as jest.Mock;
const mockedGetUserProficiencySnapshot = getUserProficiencySnapshot as jest.Mock;

const createMockRequest = (body: any) =>
  new NextRequest("http://localhost/api/ai/dashboard-tutor-chat", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("API Route: /api/ai/dashboard-tutor-chat (Integration)", () => {
  let userWithData: User;
  let newUser: User;
  const mockGetDashboardTutorResponse = jest.fn();

  beforeAll(async () => {
    // Create a user with data
    const userIdWithData = `d-tutor-user-data-${Date.now()}`;
    userWithData = await prisma.user.create({
      data: {
        id: userIdWithData,
        email: `${userIdWithData}@example.com`,
        supabaseAuthId: `${userIdWithData}-supa`,
        nativeLanguage: "english",
        goals: { weeklyJournals: 5 },
      },
    });
    // Create a new user with no data
    const newUserId = `d-tutor-user-new-${Date.now()}`;
    newUser = await prisma.user.create({
      data: { id: newUserId, email: `${newUserId}@example.com`, supabaseAuthId: `${newUserId}-supa`, nativeLanguage: "english" },
    });

    // Seed data for the user with data
    const topic = await prisma.topic.create({ data: { userId: userWithData.id, title: "Test", targetLanguage: "spanish" } });
    const entry = await prisma.journalEntry.create({ data: { authorId: userWithData.id, topicId: topic.id, content: encrypt("..."), targetLanguage: "spanish" } });
    const analysis = await prisma.analysis.create({ data: { entryId: entry.id, grammarScore: 80, phrasingScore: 80, vocabScore: 80, feedbackJson: encrypt("{}"), rawAiResponse: encrypt("{}") } });
    await prisma.mistake.create({ data: { analysisId: analysis.id, type: "grammar", originalText: encrypt("malo"), correctedText: encrypt("bueno"), explanation: encrypt("exp") } });
    await prisma.srsReviewItem.create({ data: { userId: userWithData.id, frontContent: "a", backContent: "b", type: SrsItemType.MISTAKE, nextReviewAt: new Date(), targetLanguage: "spanish" } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userWithData.id } });
    await prisma.user.delete({ where: { id: newUser.id } });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAIService.mockReturnValue({
      getDashboardTutorResponse: mockGetDashboardTutorResponse,
    } as any);
  });

  it("should assemble a full context for an existing user", async () => {
    // --- Arrange ---
    mockedCreateClient.mockReturnValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: userWithData } }) } });
    const mockSnapshot = { averageScore: 85, trend: "improving", challengingConcepts: [] };
    mockedGetUserProficiencySnapshot.mockResolvedValue(mockSnapshot as any);
    mockGetDashboardTutorResponse.mockResolvedValue({ result: "Response" });

    const request = createMockRequest({ targetLanguage: "spanish", chatHistory: [] });

    // --- Act ---
    const response = await POST(request);

    // --- Assert ---
    expect(response.status).toBe(200);
    expect(mockGetDashboardTutorResponse).toHaveBeenCalledTimes(1);
    
    const [context, history] = mockGetDashboardTutorResponse.mock.calls[0];
    
    expect(context.nativeLanguage).toBe("english");
    expect(context.targetLanguage).toBe("spanish");
    expect(context.goals).toEqual({ weeklyJournals: 5 });
    expect(context.snapshot).toEqual(mockSnapshot);
    expect(context.recentMistakes).toHaveLength(1);
    expect(context.recentMistakes[0].original).toBe("malo");
    expect(context.srsStats.total).toBe(1);
  });

  it("should assemble a minimal context for a new user", async () => {
    // --- Arrange ---
    mockedCreateClient.mockReturnValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: newUser } }) } });
    const mockSnapshot = { averageScore: 0, trend: "new", challengingConcepts: [] };
    mockedGetUserProficiencySnapshot.mockResolvedValue(mockSnapshot as any);
    mockGetDashboardTutorResponse.mockResolvedValue({ result: "Response" });

    const request = createMockRequest({ targetLanguage: "spanish", chatHistory: [] });

    // --- Act ---
    const response = await POST(request);

    // --- Assert ---
    expect(response.status).toBe(200);
    expect(mockGetDashboardTutorResponse).toHaveBeenCalledTimes(1);
    
    const [context, history] = mockGetDashboardTutorResponse.mock.calls[0];

    expect(context.nativeLanguage).toBe("english");
    expect(context.goals).toBeNull();
    expect(context.snapshot.trend).toBe("new");
    expect(context.recentMistakes).toHaveLength(0);
    expect(context.srsStats.total).toBe(0);
  });
});