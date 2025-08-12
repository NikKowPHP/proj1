/** @jest-environment node */
import { GET } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { SrsItemType, User } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/supabase/server");

const mockedCreateClient = createClient as jest.Mock;

describe("API Route: /api/srs/drill (Integration)", () => {
  let user: User;

  const createMockRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    const url = `http://localhost/api/srs/drill?${searchParams.toString()}`;
    return new NextRequest(url);
  };

  beforeAll(async () => {
    const userId = `drill-test-user-${Date.now()}`;
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        supabaseAuthId: `${userId}-supa`,
      },
    });

    // Create a mix of learned and unlearned items
    await prisma.srsReviewItem.createMany({
      data: [
        {
          userId: user.id,
          frontContent: "Learned 1",
          backContent: "",
          type: SrsItemType.MISTAKE,
          targetLanguage: "spanish",
          nextReviewAt: new Date(),
          lastReviewedAt: new Date(), // This makes it "learned"
        },
        {
          userId: user.id,
          frontContent: "Learned 2",
          backContent: "",
          type: SrsItemType.MISTAKE,
          targetLanguage: "spanish",
          nextReviewAt: new Date(),
          lastReviewedAt: new Date(),
        },
        {
          userId: user.id,
          frontContent: "Unlearned",
          backContent: "",
          type: SrsItemType.MISTAKE,
          targetLanguage: "spanish",
          nextReviewAt: new Date(),
          lastReviewedAt: null, // This has not been reviewed
        },
      ],
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

  it("should fetch only learned items for a drill session", async () => {
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
    const frontContents = body.map((item: any) => item.frontContent);
    expect(frontContents).toContain("Learned 1");
    expect(frontContents).toContain("Learned 2");
    expect(frontContents).not.toContain("Unlearned");
  });

  it("should return an empty array for a user with no learned items", async () => {
    const newUser = { id: "new-drill-user" };
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: newUser } }),
      },
    });
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});