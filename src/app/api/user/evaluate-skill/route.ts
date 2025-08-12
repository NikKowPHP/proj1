import { NextResponse } from "next/server";
import { getAIService } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  logger.info(`Skill evaluation requested by user ${user.id}`);

  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return new NextResponse("Missing text or targetLanguage field", {
        status: 400,
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { nativeLanguage: true },
    });

    if (!dbUser?.nativeLanguage) {
      return new NextResponse("User native language not set", { status: 400 });
    }

    const languageProfile = await prisma.languageProfile.findUnique({
      where: {
        userId_language: { userId: user.id, language: targetLanguage },
      },
      select: { aiAssessedProficiency: true },
    });

    // Use the user's existing proficiency if available. Otherwise, use a neutral
    // default of 50 (intermediate) for the initial assessment. This ensures the AI's
    // feedback model is calibrated appropriately without being too lenient or too strict.
    const proficiencyForEvaluation = languageProfile?.aiAssessedProficiency ?? 50;

    const aiService = getAIService();
    const { result: analysisResult } = await aiService.analyzeJournalEntry(
      text,
      targetLanguage,
      proficiencyForEvaluation,
      dbUser.nativeLanguage,
      null, // No aids usage for this context
      undefined, // No mode for this context
      user.id,
    );

    // Calculate average score from the analysis
    const averageScore =
      (analysisResult.grammarScore +
        analysisResult.phrasingScore +
        analysisResult.vocabularyScore) /
      3;

    return NextResponse.json({ score: averageScore });
  } catch (error) {
    logger.error("Error in skill evaluation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}