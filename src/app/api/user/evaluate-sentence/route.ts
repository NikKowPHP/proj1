import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";

const evaluateSentenceSchema = z.object({
  sentence: z.string().min(1),
  concept: z.string().min(1),
  targetLanguage: z.string().min(1),
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
        `[API:user/evaluate-sentence] Internal rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        { error: "You've reached your daily limit for checking sentences." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = evaluateSentenceSchema.safeParse(body);

    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { sentence, concept, targetLanguage } = parsed.data;

    const aiService = getAIService();
    const { result } = await aiService.evaluateUserSentence({
      sentence,
      concept,
      targetLanguage,
      nativeLanguage: dbUser.nativeLanguage,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("[API:evaluate-sentence] An unexpected error occurred.", {
      error,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}