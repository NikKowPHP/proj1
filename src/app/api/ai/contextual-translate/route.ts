import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";

const contextualTranslateRequestSchema = z.object({
  selectedText: z.string().min(1),
  context: z.string().min(1),
  sourceLanguage: z.string().min(1),
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

    logger.info(`/api/ai/contextual-translate - POST - User: ${user.id}`);

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
        `[API:ai/contextual-translate] Internal rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        { error: "You've reached your daily translation limit." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsedRequest = contextualTranslateRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { selectedText, context, sourceLanguage, targetLanguage } =
      parsedRequest.data;

    const aiService = getAIService();

    const { result } = await aiService.contextualTranslate({
      selectedText,
      context,
      sourceLanguage,
      targetLanguage,
      nativeLanguage: dbUser.nativeLanguage,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error in contextual-translate API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}