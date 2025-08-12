/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { getUserProficiencySnapshot } from "@/lib/services/analytics.service";
import { encrypt } from "@/lib/encryption";
import type { User, JournalAnalysisResult } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/ai");
jest.mock("@/lib/services/analytics.service");

const mockedCreateClient = createClient as jest.Mock;
const mockedGetAIService = getAIService as jest.Mock;
const mockedGetUserProficiencySnapshot = getUserProficiencySnapshot as jest.Mock;

const createMockRequest = (body: any) =>
  new NextRequest("http://localhost/api/ai/journal-tutor-chat", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("API Route: /api/ai/journal-tutor-chat (Integration)", () => {
  let user: User;
  const mockGetJournalTutorResponse = jest.fn();

  beforeAll(async () => {
    const userId = `jtc-user-${Date.now()}`;
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        supabaseAuthId: `${userId}-supa`,
        nativeLanguage: "english",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user } }),
      },
    });
    mockedGetAIService.mockReturnValue({
      getJournalTutorResponse: mockGetJournalTutorResponse,
    } as any);
  });

  it("should assemble the correct context and call the AI service", async () => {
    // --- Arrange ---
    // 1. Mock the snapshot service
    const mockSnapshot = {
      averageScore: 80,
      trend: "improving",
      challengingConcepts: [],
    };
    mockedGetUserProficiencySnapshot.mockResolvedValue(mockSnapshot as any);

    // 2. Mock the AI response
    const mockAIResponse = "This is the tutor's response.";
    mockGetJournalTutorResponse.mockResolvedValue({
      result: mockAIResponse,
      serviceUsed: "gemini",
    });

    // 3. Create data in the test database
    const topic = await prisma.topic.create({
      data: { userId: user.id, title: "Test Topic", targetLanguage: "spanish" },
    });
    const analysisResult: JournalAnalysisResult = {
      grammarScore: 85,
      phrasingScore: 90,
      vocabularyScore: 88,
      feedback: "Good work.",
      mistakes: [],
      highlights: [],
    };
    const journal = await prisma.journalEntry.create({
      data: {
        authorId: user.id,
        topicId: topic.id,
        content: encrypt("Este es mi diario."),
        targetLanguage: "spanish",
        analysis: {
          create: {
            grammarScore: analysisResult.grammarScore,
            phrasingScore: analysisResult.phrasingScore,
            vocabScore: analysisResult.vocabularyScore,
            feedbackJson: encrypt(analysisResult.feedback),
            rawAiResponse: encrypt(JSON.stringify(analysisResult)),
          },
        },
      },
    });

    const requestBody = {
      journalId: journal.id,
      chatHistory: [{ role: "user", content: "Hello" }],
    };
    const request = createMockRequest(requestBody);

    // --- Act ---
    const response = await POST(request);
    const body = await response.json();

    // --- Assert ---
    expect(response.status).toBe(200);
    expect(body).toEqual({ response: mockAIResponse });

    // Verify snapshot was called correctly
    expect(mockedGetUserProficiencySnapshot).toHaveBeenCalledWith(
      user.id,
      "spanish",
    );

    // Verify AI service was called with correctly assembled context
    expect(mockGetJournalTutorResponse).toHaveBeenCalledTimes(1);
    const [context, chatHistory] = mockGetJournalTutorResponse.mock.calls[0];

    expect(chatHistory).toEqual(requestBody.chatHistory);
    expect(context.journal.title).toBe("Test Topic");
    expect(context.journal.content).toBe("Este es mi diario.");
    expect(context.analysis.grammarScore).toBe(85);
    expect(context.snapshot).toEqual(mockSnapshot);
    expect(context.nativeLanguage).toBe("english");
  });
});