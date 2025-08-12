// src/app/api/ai/evaluate-drill-down/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { encrypt } from "@/lib/encryption";
import { PostHog } from "posthog-node";

let posthog: PostHog | null = null;
if (
  process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  process.env.NEXT_PUBLIC_POSTHOG_HOST
) {
  posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

const evaluateDrillDownSchema = z.object({
  mistakeId: z.string(),
  taskPrompt: z.string(),
  expectedAnswer: z.string(),
  userAnswer: z.string(),
  targetLanguage: z.string(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, nativeLanguage: true },
    });
    if (!dbUser?.nativeLanguage) {
      return new NextResponse("User native language not set.", { status: 400 });
    }

    const rateLimitResult = tieredRateLimiter(
      user.id,
      dbUser?.subscriptionTier || "FREE",
    );
    if (!rateLimitResult.allowed) {
      logger.warn(
        `[API:ai/evaluate-drill-down] Internal rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        {
          error: "You've reached your daily limit for checking practice answers.",
        },
        { status: 429 },
      );
    }

    const parsed = evaluateDrillDownSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { mistakeId, taskPrompt, expectedAnswer, userAnswer, targetLanguage } =
      parsed.data;

    const aiService = getAIService();
    const { result: evaluationResult } =
      await aiService.evaluateDrillDownAnswer({
        taskPrompt,
        expectedAnswer,
        userAnswer,
        targetLanguage,
        nativeLanguage: dbUser.nativeLanguage,
        mistakeId, // This isn't used by the prompt but is part of the type now
      });

    // Store the practice attempt
    await prisma.practiceAttempt.create({
      data: {
        mistakeId,
        userId: user.id,
        taskPrompt,
        expectedAnswer,
        userAnswer,
        aiEvaluationJson: encrypt(JSON.stringify(evaluationResult)), // Encrypt AI's raw evaluation
        isCorrect: evaluationResult.isCorrect,
        score: evaluationResult.score, // Store the numerical score
      },
    });

    if (posthog) {
      posthog.capture({
        distinctId: user.id,
        event: "DrillDownEvaluationCompleted",
        properties: {
          latency: Date.now() - startTime,
          mistakeId,
          targetLanguage,
          isCorrect: evaluationResult.isCorrect,
          score: evaluationResult.score,
        },
      });
    }

    return NextResponse.json(evaluationResult);
  } catch (error) {
    logger.error("[API:evaluate-drill-down] An unexpected error occurred.", {
      error,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
    if (posthog) await posthog.shutdown();
  }
}