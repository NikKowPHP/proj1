/** @jest-environment node */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { ReadingLevel } from "@prisma/client";
import { encrypt } from "@/lib/encryption";

jest.mock("@/lib/supabase/server");

const mockedCreateClient = createClient as jest.Mock;

describe("API Route: /api/reading-material (Integration)", () => {
  let user: any;
  const createMockRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = `http://localhost/api/reading-material?${searchParams.toString()}`;
    return new NextRequest(url);
  };

  beforeAll(async () => {
    const userId = `reading-test-user-${Date.now()}`;
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        supabaseAuthId: `${userId}-supa`,
        languageProfiles: {
          create: { language: "spanish", aiAssessedProficiency: 15.0 }, // Beginner
        },
      },
    });
    // Seed some reading material
    await prisma.readingMaterial.createMany({
      data: [
        {
          title: encrypt("Beginner Spanish Story"),
          content: encrypt("..."),
          targetLanguage: "spanish",
          level: ReadingLevel.BEGINNER,
        },
        {
          title: encrypt("Intermediate Spanish Story"),
          content: encrypt("..."),
          targetLanguage: "spanish",
          level: ReadingLevel.INTERMEDIATE,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.readingMaterial.deleteMany({ where: { targetLanguage: "spanish" } });
  });

  beforeEach(() => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user } }),
      },
    });
  });

  it("should return a BEGINNER level text for a user with low proficiency", async () => {
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.title).toBe("Beginner Spanish Story");
    expect(body.level).toBe(ReadingLevel.BEGINNER);
  });
});