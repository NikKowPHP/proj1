import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { decrypt } from "@/lib/encryption";
import type { DashboardTutorContext, TutorChatMessage } from "@/lib/types";
import { getUserProficiencySnapshot } from "@/lib/services/analytics.service";
import { tieredRateLimiter } from "@/lib/rateLimiter";

const dashboardTutorChatSchema = z.object({
  targetLanguage: z.string(),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
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

    const body = await req.json();
    const parsed = dashboardTutorChatSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { targetLanguage, chatHistory } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true, nativeLanguage: true, goals: true },
    });
    if (!dbUser?.nativeLanguage) {
      return new NextResponse("User profile is incomplete.", { status: 400 });
    }

    const rateLimitResult = tieredRateLimiter(
      user.id,
      dbUser.subscriptionTier,
    );
    if (!rateLimitResult.allowed) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    // --- Data Aggregation ---
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);
    const endOfWeek = new Date(todayStart);
    endOfWeek.setDate(todayStart.getDate() + (7 - todayStart.getDay()));

    const [
      snapshot,
      recentMistakesFromDb,
      dueToday,
      dueThisWeek,
      totalSrsItems,
    ] = await Promise.all([
      getUserProficiencySnapshot(user.id, targetLanguage),
      prisma.mistake.findMany({
        where: { analysis: { entry: { authorId: user.id, targetLanguage } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.srsReviewItem.count({
        where: { userId: user.id, targetLanguage, nextReviewAt: { lte: tomorrowStart } },
      }),
      prisma.srsReviewItem.count({
        where: { userId: user.id, targetLanguage, nextReviewAt: { lte: endOfWeek } },
      }),
      prisma.srsReviewItem.count({
        where: { userId: user.id, targetLanguage },
      }),
    ]);

    const recentMistakes = recentMistakesFromDb.map((m) => ({
      original: decrypt(m.originalText) || "",
      corrected: decrypt(m.correctedText) || "",
      explanation: decrypt(m.explanation) || "",
    }));

    // --- Assemble Context ---
    const context: DashboardTutorContext = {
      nativeLanguage: dbUser.nativeLanguage,
      targetLanguage,
      goals: (dbUser.goals as any) || null,
      snapshot,
      recentMistakes,
      srsStats: {
        dueToday,
        dueThisWeek,
        total: totalSrsItems,
      },
    };

    // --- Call AI Service ---
    const aiService = getAIService();
    const { result: aiResponse } = await aiService.getDashboardTutorResponse(
      context,
      chatHistory,
      user.id,
    );

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    logger.error("[API:dashboard-tutor-chat] An unexpected error occurred.", {
      error,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}