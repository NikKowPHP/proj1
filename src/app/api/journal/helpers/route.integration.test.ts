/** @jest-environment node */
import { POST } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { getChallengingConcepts } from "@/lib/services/practice.service";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/ai");
jest.mock("@/lib/services/practice.service");

const mockedCreateClient = createClient as jest.Mock;
const mockedGetAIService = getAIService as jest.Mock;
const mockedGetChallengingConcepts = getChallengingConcepts as jest.Mock;
const mockGenerateAids = jest.fn();

const createMockRequest = (body: any) =>
  new NextRequest("http://localhost/api/journal/helpers", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("API Route: /api/journal/helpers (Integration)", () => {
  const mockUser = { id: "user-123" };
  const mockLanguageProfile = { aiAssessedProficiency: 50 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    (prisma.languageProfile.findUnique as jest.Mock) = jest
      .fn()
      .mockResolvedValue(mockLanguageProfile);
    mockedGetAIService.mockReturnValue({
      generateJournalingAids: mockGenerateAids,
    } as any);
  });

  it("calls AI service with struggles when challenging concepts are found", async () => {
    const mockConcepts = [
      { mistakeId: "m1", explanation: "Concept 1" },
      { mistakeId: "m2", explanation: "Concept 2" },
    ];
    mockedGetChallengingConcepts.mockResolvedValue(mockConcepts);
    mockGenerateAids.mockResolvedValue({
      result: { sentenceStarter: "Start here" },
    });

    const request = createMockRequest({
      topic: "My Day",
      targetLanguage: "spanish",
    });
    await POST(request);

    expect(mockedGetChallengingConcepts).toHaveBeenCalledWith(
      mockUser.id,
      "spanish",
    );
    expect(mockGenerateAids).toHaveBeenCalledWith(
      {
        topic: "My Day",
        targetLanguage: "spanish",
        proficiency: 50,
        struggles: mockConcepts,
      },
      undefined,
    );
  });

  it("calls AI service without struggles when no challenging concepts are found", async () => {
    mockedGetChallengingConcepts.mockResolvedValue([]);
    mockGenerateAids.mockResolvedValue({
      result: { sentenceStarter: "Start here" },
    });

    const request = createMockRequest({
      topic: "My Day",
      targetLanguage: "spanish",
    });
    await POST(request);

    expect(mockedGetChallengingConcepts).toHaveBeenCalledWith(
      mockUser.id,
      "spanish",
    );
    expect(mockGenerateAids).toHaveBeenCalledWith(
      {
        topic: "My Day",
        targetLanguage: "spanish",
        proficiency: 50,
        struggles: undefined,
      },
      undefined,
    );
  });
});