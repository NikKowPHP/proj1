/** @jest-environment node */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { User, Topic, JournalEntry, Analysis, Mistake } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/supabase/server");

const mockedCreateClient = createClient as jest.Mock;

describe("API Route: /api/user/mistakes (Integration)", () => {
  let user: User, topic: Topic, journal: JournalEntry, analysis: Analysis;
  let mistake1: Mistake, mistake2: Mistake;

  const createMockRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = `http://localhost/api/user/mistakes?${searchParams.toString()}`;
    return new NextRequest(url);
  };

  beforeAll(async () => {
    const userId = `mistakes-test-user-${Date.now()}`;
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        supabaseAuthId: `${userId}-supa`,
      },
    });
    topic = await prisma.topic.create({
      data: { userId: user.id, title: "Mistake Test", targetLanguage: "spanish" },
    });
    journal = await prisma.journalEntry.create({
      data: {
        authorId: user.id,
        topicId: topic.id,
        content: encrypt("..."),
        targetLanguage: "spanish",
      },
    });
    analysis = await prisma.analysis.create({
      data: { entryId: journal.id, grammarScore: 80, phrasingScore: 80, vocabScore: 80, feedbackJson: encrypt("{}"), rawAiResponse: encrypt("{}") },
    });
    mistake1 = await prisma.mistake.create({
      data: { analysisId: analysis.id, type: "grammar", originalText: encrypt("malo1"), correctedText: encrypt("bueno1"), explanation: encrypt("exp1") },
    });
    mistake2 = await prisma.mistake.create({
      data: { analysisId: analysis.id, type: "vocabulary", originalText: encrypt("malo2"), correctedText: encrypt("bueno2"), explanation: encrypt("exp2") },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
  });

  beforeEach(() => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user } }),
      },
    });
  });

  it("should fetch all mistakes for a user", async () => {
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mistakes).toHaveLength(2);
    expect(body.totalCount).toBe(2);
    expect(body.mistakes[0].originalText).toBe("malo2"); // Desc order
  });

  it("should filter mistakes by type", async () => {
    const request = createMockRequest({ targetLanguage: "spanish", type: "grammar" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mistakes).toHaveLength(1);
    expect(body.totalCount).toBe(1);
    expect(body.mistakes[0].id).toBe(mistake1.id);
  });

  it("should handle pagination correctly", async () => {
    const request = createMockRequest({ targetLanguage: "spanish", page: "2", limit: "1" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mistakes).toHaveLength(1);
    expect(body.totalCount).toBe(2);
    expect(body.mistakes[0].id).toBe(mistake1.id);
  });
});