import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  // Get client IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";

  // Apply rate limiting
  const limit = authRateLimiter(ip);
  if (!limit.allowed) {
    logger.warn(`[API:auth/signout] Internal auth rate limit exceeded for IP: ${ip}`);
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(); // Get user for logging
    if (user) {
      logger.info(`/api/auth/signout - POST - User: ${user.id}`);
    } else {
      logger.info("/api/auth/signout - POST - No user session found.");
    }
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Signout error:", error);
      return NextResponse.json(
        {
          error: error.message,
          code: error.code || "SIGNOUT_ERROR",
        },
        { status: 500 },
      );
    }

    return NextResponse.redirect(new URL("/login", request.url), {
      status: 302,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    logger.error("Server error during signout:", error);
    return NextResponse.json(
      {
        error: message,
        code: "SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}