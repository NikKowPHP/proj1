import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { TutorChatMessage } from "@/lib/types";
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

const tutorChatSchema = z.object({
  mistakeId: z.string(),
  mistakeContext: z.object({
    original: z.string(),
    corrected: z.string(),
    explanation: z.string(),
  }),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  userQuestion: z.string().min(1).max(500),
  targetLanguage: z.string(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
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
      return NextResponse.json(
        { error: "You've reached your daily limit for AI tutor chat." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = tutorChatSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const {
      mistakeId,
      mistakeContext,
      chatHistory,
      userQuestion,
      targetLanguage,
    } = parsed.data;

    const fullChatHistory: TutorChatMessage[] = [
      ...chatHistory,
      { role: "user", content: userQuestion },
    ];

    const aiService = getAIService();
    const { result: aiResponse } = await aiService.getTutorResponse(
      {
        mistakeId,
        mistakeContext,
        chatHistory: fullChatHistory,
        targetLanguage,
        nativeLanguage: dbUser.nativeLanguage,
      },
      user.id,
    );
    
    if (posthog) {
      posthog.capture({
        distinctId: user.id,
        event: "TutorChat_Response_Received",
        properties: {
          latency: Date.now() - startTime,
          mistakeId: mistakeId,
          targetLanguage: targetLanguage,
          chatHistoryLength: fullChatHistory.length,
        },
      });
    }


    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    logger.error("[API:tutor-chat] An unexpected error occurred.", { error });
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
    if (posthog) await posthog.shutdown();
  }
}