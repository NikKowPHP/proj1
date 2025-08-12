import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { decrypt } from "@/lib/encryption";
import type {
  JournalAnalysisResult,
  JournalTutorContext,
  TutorChatMessage,
} from "@/lib/types";
import { getUserProficiencySnapshot } from "@/lib/services/analytics.service";

const journalTutorChatSchema = z.object({
  journalId: z.string(),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

const MAX_HISTORY_MESSAGES = 10;

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
    const parsed = journalTutorChatSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { journalId, chatHistory } = parsed.data;

    // 1. Fetch journal data
    const journal = await prisma.journalEntry.findUnique({
      where: { id: journalId, authorId: user.id },
      include: { topic: true, analysis: { include: { mistakes: true } } },
    });

    const targetLanguage = journal?.targetLanguage;

    if (!journal || !journal.analysis || !targetLanguage) {
      return new NextResponse(
        "Required journal data not found for tutor chat.",
        { status: 404 },
      );
    }

    // 2. Fetch user profile and snapshot in parallel
    const [dbUser, snapshot] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { nativeLanguage: true },
      }),
      getUserProficiencySnapshot(user.id, targetLanguage),
    ]);

    if (!dbUser?.nativeLanguage) {
      return new NextResponse("User profile is incomplete.", { status: 400 });
    }

    // 3. Decrypt and assemble context
    const decryptedContent = decrypt(journal.content);
    const rawAiResponse = decrypt(journal.analysis.rawAiResponse);
    if (!decryptedContent || !rawAiResponse) {
      throw new Error(
        `Failed to decrypt necessary data for journal ${journalId}`,
      );
    }

    const analysisResult: JournalAnalysisResult = JSON.parse(rawAiResponse);
    const context: JournalTutorContext = {
      journal: {
        title: journal.topic.title,
        content: decryptedContent,
        targetLanguage,
      },
      analysis: analysisResult,
      snapshot,
      nativeLanguage: dbUser.nativeLanguage,
    };

    // 4. Truncate history
    const truncatedHistory = chatHistory.slice(-MAX_HISTORY_MESSAGES);

    // 5. Call AI service
    const aiService = getAIService();
    const { result: aiResponse } = await aiService.getJournalTutorResponse(
      context,
      truncatedHistory,
      user.id,
    );

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    logger.error("[API:journal-tutor-chat] An unexpected error occurred.", {
      error,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}