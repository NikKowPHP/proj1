// src/app/api/ai/stuck-helper/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";

const stuckHelperSchema = z.object({
  topic: z.string(),
  currentText: z.string(),
  targetLanguage: z.string(),
});

export async function POST(req: NextRequest) {
  logger.info("[API:stuck-helper] Received POST request.");
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn("[API:stuck-helper] Unauthorized: No user session found.");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    logger.info(`[API:stuck-helper] Request initiated by user: ${user.id}`);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true },
    });
    const tier = dbUser?.subscriptionTier || "FREE";
    logger.info(`[API:stuck-helper] User tier is: ${tier}`);

    // Rate limit based on user's subscription tier
    const rateLimitResult = tieredRateLimiter(user.id, tier);

    if (!rateLimitResult.allowed) {
      logger.warn(
        `[API:stuck-helper] Internal rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        { error: "You've reached your daily limit for writing suggestions." },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "86400",
          },
        },
      );
    }
    logger.info(`[API:stuck-helper] User passed rate limit.`);

    const body = await req.json();
    logger.info("[API:stuck-helper] Parsed request body.", { body });

    const parsed = stuckHelperSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn("[API:stuck-helper] Invalid request body.", {
        error: parsed.error,
      });
      return new NextResponse("Invalid request body", { status: 400 });
    }
    logger.info("[API:stuck-helper] Request body validation successful.");

    const { topic, currentText, targetLanguage } = parsed.data;

    const aiService = getAIService();

    logger.info("[API:stuck-helper] Calling AI service with payload.", {
      payload: parsed.data,
    });
    const { result: suggestions } =
      await aiService.generateStuckWriterSuggestions(
        {
          topic,
          currentText,
          targetLanguage,
        },
        user.id,
      );
    logger.info(
      "[API:stuck-helper] Received successful response from AI service.",
      { suggestions },
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    logger.error("[API:stuck-helper] An unexpected error occurred.", { error });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}