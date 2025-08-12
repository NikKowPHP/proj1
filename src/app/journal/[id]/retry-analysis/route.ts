// Note: This route handles decryption of JournalEntry content and encryption of new Analysis data.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { logger } from "@/lib/logger";
import { encrypt, decrypt } from "@/lib/encryption";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: journalId } = await params;
  if (!journalId) {
    return NextResponse.json(
      { error: "Journal ID is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info(
    `Retry analysis requested for journal ${journalId} by user ${user.id}`,
  );

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { nativeLanguage: true },
    });
    if (!dbUser?.nativeLanguage) {
      return NextResponse.json(
        { error: "User native language not set" },
        { status: 400 },
      );
    }

    let generatedTitle: string | undefined;
    const journal = await prisma.journalEntry.findFirst({
      where: { id: journalId, authorId: user.id },
      include: {
        topic: true,
        analysis: true,
      },
    });

    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }
    const targetLanguage = journal.targetLanguage;

    if (!targetLanguage) {
      return NextResponse.json(
        {
          error:
            "Cannot retry analysis: target language not set for this legacy journal entry.",
        },
        { status: 400 },
      );
    }

    const decryptedContent = decrypt(journal.content);
    if (decryptedContent === null) {
      throw new Error(`Failed to decrypt content for journal ${journalId}`);
    }

    const languageProfile = await prisma.languageProfile.findUnique({
      where: {
        userId_language: { userId: user.id, language: targetLanguage },
      },
    });
    const proficiencyScore = languageProfile?.aiAssessedProficiency || 2.0;

    const aiService = getAIService();
    const { result: analysisResult } = await aiService.analyzeJournalEntry(
      decryptedContent,
      targetLanguage,
      proficiencyScore,
      dbUser.nativeLanguage,
      journal.aidsUsage as any[] | null,
    );

    if (journal.topic?.title === "Free Write") {
      const { result } = await aiService.generateTitleForEntry(
        decryptedContent,
        user.id,
      );
      generatedTitle = result;
    }

    const newAnalysis = await prisma.$transaction(async (tx) => {
      if (journal.analysis) {
        await tx.analysis.delete({
          where: { id: journal.analysis.id },
        });
      }

      if (generatedTitle) {
        await tx.topic.update({
          where: { id: journal.topicId },
          data: { title: generatedTitle },
        });
      }

      const createdAnalysis = await tx.analysis.create({
        data: {
          entryId: journalId,
          grammarScore: analysisResult.grammarScore,
          phrasingScore: analysisResult.phrasingScore,
          vocabScore: analysisResult.vocabularyScore,
          feedbackJson: encrypt(analysisResult.feedback),
          rawAiResponse: encrypt(JSON.stringify(analysisResult)),
          mistakes: {
            create: analysisResult.mistakes.map((mistake) => ({
              type: mistake.type,
              originalText: encrypt(mistake.original),
              correctedText: encrypt(mistake.corrected),
              explanation: encrypt(mistake.explanation),
            })),
          },
        },
      });

      const userAnalyses = await tx.analysis.findMany({
        where: {
          entry: {
            authorId: user.id,
            targetLanguage: targetLanguage,
          },
        },
        select: {
          grammarScore: true,
          phrasingScore: true,
          vocabScore: true,
        },
      });

      const totalScores = userAnalyses.reduce((acc, analysis) => {
        return (
          acc +
          analysis.grammarScore +
          analysis.phrasingScore +
          analysis.vocabScore
        );
      }, 0);

      const averageScore =
        userAnalyses.length > 0 ? totalScores / (userAnalyses.length * 3) : 0;

      await tx.languageProfile.update({
        where: {
          userId_language: { userId: user.id, language: targetLanguage },
        },
        data: { aiAssessedProficiency: averageScore },
      });

      return createdAnalysis;
    });

    return NextResponse.json(newAnalysis);
  } catch (error) {
    logger.error(`Error retrying analysis for journal ${journalId}`, error);
    return NextResponse.json(
      { error: "Failed to retry analysis" },
      { status: 500 },
    );
  }
}