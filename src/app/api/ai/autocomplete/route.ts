import { NextRequest, NextResponse } from "next/server";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const aiService = getAIService();

export const POST = async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  logger.info(`/api/ai/autocomplete - POST - User: ${user.id}`);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { subscriptionTier: true },
  });

  // Rate limit based on user's subscription tier
  const rateLimitResult = tieredRateLimiter(
    user.id,
    dbUser?.subscriptionTier || "FREE",
  );

  if (!rateLimitResult.allowed) {
    logger.warn(
      `[API:ai/autocomplete] Internal rate limit exceeded for user: ${user.id}`,
    );
    return NextResponse.json(
      { error: "You've reached your daily limit for AI suggestions." },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.retryAfter?.toString() || "86400", // 24 hours
        },
      },
    );
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new NextResponse("Missing text field", { status: 400 });
    }

    const { result: completedText } = await aiService.getSentenceCompletion(
      text,
      user.id,
    );

    return NextResponse.json({ completedText });
  } catch (error) {
    logger.error("Error in autocomplete API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};