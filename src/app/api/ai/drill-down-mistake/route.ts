import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { decrypt } from "@/lib/encryption";
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

const drillDownSchema = z.object({
  mistakeId: z.string(),
  originalText: z.string(),
  correctedText: z.string(),
  explanation: z.string(),
  targetLanguage: z.string(),
  existingTasks: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logger.warn("[API:drill-down] Unauthorized: No user session found.");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    logger.info(`[API:drill-down] Request initiated by user: ${user.id}`);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, nativeLanguage: true },
    });

    if (!dbUser?.nativeLanguage) {
      return new NextResponse("User native language not set.", { status: 400 });
    }

    const tier = dbUser?.subscriptionTier || "FREE";
    const rateLimitResult = tieredRateLimiter(user.id, tier);

    if (!rateLimitResult.allowed) {
      logger.warn(
        `[API:drill-down] Internal rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        {
          error:
            "You've reached your daily limit for generating practice exercises.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "86400",
          },
        },
      );
    }

    const body = await req.json();
    const parsed = drillDownSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn("[API:drill-down] Invalid request body.", {
        error: parsed.error,
      });
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const {
      mistakeId,
      originalText,
      correctedText,
      explanation,
      targetLanguage,
      existingTasks,
    } = parsed.data;

    // Fetch recent low-scoring attempts for this specific mistake
    const recentAttempts = await prisma.practiceAttempt.findMany({
      where: {
        mistakeId: mistakeId,
        userId: user.id,
        score: {
          lt: 70, // User struggled with these
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    const decryptedPreviousAttempts = recentAttempts
      .map((attempt) => {
        const decryptedEval = decrypt(attempt.aiEvaluationJson);
        if (!decryptedEval) return null;
        try {
          const evaluation = JSON.parse(decryptedEval);
          return {
            taskPrompt: attempt.taskPrompt,
            userAnswer: attempt.userAnswer,
            feedback: evaluation.feedback,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const aiService = getAIService();
    const { result } = await aiService.generateDrillDownExercises(
      {
        original: originalText,
        corrected: correctedText,
        explanation,
        targetLanguage,
        nativeLanguage: dbUser.nativeLanguage,
        previousAttempts: decryptedPreviousAttempts as any,
        existingTasks,
      },
      user.id,
    );

    if (posthog) {
      posthog.capture({
        distinctId: user.id,
        event: "DrillDownGenerated",
        properties: {
          latency: Date.now() - startTime,
          mistakeId,
          targetLanguage,
        },
      });
    }

    logger.info(
      "[API:drill-down] Received successful response from AI service.",
    );
    return NextResponse.json(result);
  } catch (error) {
    logger.error("[API:drill-down] An unexpected error occurred.", { error });
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
    if (posthog) await posthog.shutdown();
  }
}