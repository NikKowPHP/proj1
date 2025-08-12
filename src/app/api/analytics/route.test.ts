
/** @jest-environment node */

import { GET } from "./route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData } from "@/lib/services/analytics.service";

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/services/analytics.service");

const mockedCreateClient = createClient as jest.Mock;
const mockedGetAnalyticsData = getAnalyticsData as jest.Mock;

const mockUser = { id: "user-123" };
const mockAnalyticsResponse = { totalEntries: 5, averageScore: 80.5 };

describe("API Route: /api/analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    mockedGetAnalyticsData.mockResolvedValue(mockAnalyticsResponse as any);
  });

  const createMockRequest = (params: Record<string, string | null> = {}) => {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== null) {
        searchParams.set(key, params[key]!);
      }
    }
    const url = `http://localhost/api/analytics?${searchParams.toString()}`;
    return new NextRequest(url);
  };

  it("should return 401 Unauthorized if no user is authenticated", async () => {
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
    const request = createMockRequest({});
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toHaveProperty("targetLanguage");
  });

  it("should default to '3m' prediction horizon and call service with 90 days", async () => {
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedGetAnalyticsData).toHaveBeenCalledWith(mockUser.id, "spanish", 90);
    expect(data).toEqual(mockAnalyticsResponse);
  });

  it("should use provided '1y' prediction horizon and call service with 365 days", async () => {
    const request = createMockRequest({ targetLanguage: "spanish", predictionHorizon: '1y' });
    await GET(request);
    expect(mockedGetAnalyticsData).toHaveBeenCalledWith(mockUser.id, "spanish", 365);
  });

  it("should use provided '1m' prediction horizon and call service with 30 days", async () => {
    const request = createMockRequest({ targetLanguage: "spanish", predictionHorizon: '1m' });
    await GET(request);
    expect(mockedGetAnalyticsData).toHaveBeenCalledWith(mockUser.id, "spanish", 30);
  });

  it("should return 400 for an invalid prediction horizon", async () => {
    const request = createMockRequest({ targetLanguage: "spanish", predictionHorizon: 'invalid' });
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toHaveProperty("predictionHorizon");
  });

  it("should return 500 Internal Server Error if the service throws an error", async () => {
    const mockError = new Error("Database connection failed");
    mockedGetAnalyticsData.mockRejectedValue(mockError);
    const request = createMockRequest({ targetLanguage: "spanish" });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to fetch analytics");
  });
});