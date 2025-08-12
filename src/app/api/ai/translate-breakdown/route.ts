import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";

const translateBreakdownRequestSchema = z.object({
  text: z.string().min(1),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
});

const translateBreakdownResponseSchema = z.object({
  fullTranslation: z.string(),
  segments: z.array(
    z.object({
      source: z.string(),
      translation: z.string(),
      explanation: z.string(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    logger.info(`/api/ai/translate-breakdown - POST - User: ${user.id}`);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, nativeLanguage: true },
    });

    if (!dbUser?.nativeLanguage) {
      return new NextResponse("User native language not set.", { status: 400 });
    }

    // Rate limit based on user's subscription tier
    const rateLimitResult = tieredRateLimiter(
      user.id,
      dbUser?.subscriptionTier || "FREE",
    );

    if (!rateLimitResult.allowed) {
      logger.warn(
        `[API:ai/translate-breakdown] Internal rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        { error: "You've reached your daily translation limit." },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "86400",
          },
        },
      );
    }

    const body = await req.json();
    const parsedRequest = translateBreakdownRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { text, sourceLanguage, targetLanguage } = parsedRequest.data;

    const aiService = getAIService();

    const { result } = await aiService.translateAndBreakdown(
      text,
      sourceLanguage,
      targetLanguage,
      dbUser.nativeLanguage,
      user.id,
    );

    const parsedResult = translateBreakdownResponseSchema.safeParse(result);
    if (!parsedResult.success) {
      logger.error("AI response validation failed for translate-breakdown", {
        error: parsedResult.error,
        response: result,
      });
      return new NextResponse("Internal Server Error: AI response malformed", {
        status: 500,
      });
    }

    return NextResponse.json(parsedResult.data);
  } catch (error) {
    logger.error("Error in translate-breakdown API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}