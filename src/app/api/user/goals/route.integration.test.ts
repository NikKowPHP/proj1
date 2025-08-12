/** @jest-environment node */
import { PUT } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { User } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/supabase/server");

const mockedCreateClient = createClient as jest.Mock;

describe("API Route: /api/user/goals", () => {
  let user: User;
  const createMockRequest = (body: any) =>
    new NextRequest("http://localhost/api/user/goals", {
      method: "PUT",
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    const userId = `goals-test-user-${Date.now()}`;
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.com`,
        supabaseAuthId: `${userId}-supa`,
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
  });

  it("should update user goals successfully with a valid payload", async () => {
    const request = createMockRequest({ weeklyJournals: 5 });
    const response = await PUT(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(updatedUser?.goals).toEqual({ weeklyJournals: 5 });
  });

  it("should return 401 Unauthorized if no user is authenticated", async () => {
    mockedCreateClient.mockReturnValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const request = createMockRequest({ weeklyJournals: 5 });
    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("should return 400 Bad Request for an invalid payload", async () => {
    const request = createMockRequest({ weeklyJournals: "not-a-number" });
    const response = await PUT(request);
    expect(response.status).toBe(400);
  });
});