/** @jest-environment node */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import {
  User,
  Topic,
  JournalEntry,
  Analysis,
  Mistake,
  PracticeAttempt,
} from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/supabase/server");

const mockedCreateClient = createClient as jest.Mock;

describe("API Route: /api/user/practice-analytics (Integration)", () => {
  let user: User, topic: Topic, journal: JournalEntry, analysis: Analysis;
  let mistake1: Mistake, mistake2: Mistake, mistake3: Mistake;

  const createMockRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = `http://localhost/api/analytics?${searchParams.toString()}`;
    return new NextRequest(url);
  };

  beforeAll(async () => {
    // --- Test Data Setup ---
    const userId = `pa-user-${Date.now()}`;
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        supabaseAuthId: `${userId}-supa`,
      },
    });

    topic = await prisma.topic.create({
      data: {
        userId: user.id,
        title: "Test Topic",
        targetLanguage: "spanish",
      },
    });

    journal = await prisma.journalEntry.create({
      data: {
        authorId: user.id,
        topicId: topic.id,
        content: encrypt("Journal content"),
        targetLanguage: "spanish",
      },
    });

    analysis = await prisma.analysis.create({
      data: {
        entryId: journal.id,
        grammarScore: 80,
        phrasingScore: 80,
        vocabScore: 80,
        feedbackJson: encrypt("{}"),
        rawAiResponse: encrypt("{}"),
      },
    });

    mistake1 = await prisma.mistake.create({
      data: {
        analysisId: analysis.id,
        type: "grammar",
        originalText: encrypt("malo1"),
        correctedText: encrypt("bueno1"),
        explanation: encrypt("Explanation for mistake 1"),
      },
    });

    mistake2 = await prisma.mistake.create({
      data: {
        analysisId: analysis.id,
        type: "grammar",
        originalText: encrypt("malo2"),
        correctedText: encrypt("bueno2"),
        explanation: encrypt("Explanation for mistake 2"),
      },
    });
    
    mistake3 = await prisma.mistake.create({
      data: {
        analysisId: analysis.id,
        type: "grammar",
        originalText: encrypt("malo3"),
        correctedText: encrypt("bueno3"),
        explanation: encrypt("Explanation for mistake 3"),
      },
    });

    // --- Practice Attempts ---
    // Mistake 1: 3 attempts, low avg score (should appear in results)
    await prisma.practiceAttempt.createMany({
      data: [
        { mistakeId: mistake1.id, userId: user.id, score: 20, isCorrect: false, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
        { mistakeId: mistake1.id, userId: user.id, score: 30, isCorrect: false, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
        { mistakeId: mistake1.id, userId: user.id, score: 25, isCorrect: false, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
      ],
    });

    // Mistake 2: 3 attempts, high avg score (should be filtered out by score threshold)
     await prisma.practiceAttempt.createMany({
      data: [
        { mistakeId: mistake2.id, userId: user.id, score: 90, isCorrect: true, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
        { mistakeId: mistake2.id, userId: user.id, score: 95, isCorrect: true, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
        { mistakeId: mistake2.id, userId: user.id, score: 100, isCorrect: true, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
      ],
    });
    
    // Mistake 3: Only 2 attempts (should be filtered out by attempt count)
    await prisma.practiceAttempt.createMany({
      data: [
        { mistakeId: mistake3.id, userId: user.id, score: 10, isCorrect: false, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
        { mistakeId: mistake3.id, userId: user.id, score: 15, isCorrect: false, taskPrompt: "", expectedAnswer: "", userAnswer: "", aiEvaluationJson: encrypt("{}") },
      ],
    });
  });

  afterAll(async () => {
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  beforeEach(() => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user } }),
      },
    });
  });

  it("should return the top challenging concepts for the user", async () => {
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].mistakeId).toBe(mistake1.id);
    expect(data[0].attempts).toBe(3);
    expect(data[0].averageScore).toBeCloseTo(25);
    expect(data[0].explanation).toBe("Explanation for mistake 1");
  });

  it("should return an empty array if no concepts meet the criteria", async () => {
    // A new user with no attempts
    const newUser = { id: "new-user" };
     mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: newUser } }),
      },
    });
    
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });
  
  it("should return 401 Unauthorized if no user is found", async () => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 Bad Request if targetLanguage is missing", async () => {
    const request = createMockRequest({}); // No params
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});