import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { authRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  // Get client IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";

  // Apply rate limiting
  const limit = authRateLimiter(ip);
  if (!limit.allowed) {
    logger.warn(`[API:auth/login] Internal auth rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "Retry-After": limit.retryAfter!.toString(),
        },
      },
    );
  }

  try {
    logger.info("/api/auth/login - POST");
    // Check if request body is valid JSON
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.error("Invalid JSON format in request body:", error);
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 },
      );
    }

    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      logger.error("Login error:", { email, error });
      return NextResponse.json(
        {
          error: error.message,
          code: error.code || "AUTH_ERROR",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    logger.error("Server error during login:", error);
    return NextResponse.json(
      {
        error: message,
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}