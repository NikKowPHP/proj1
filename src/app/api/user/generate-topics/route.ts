import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const targetLanguage = url.searchParams.get("targetLanguage");
    if (!targetLanguage)
      return NextResponse.json(
        { error: "targetLanguage is required" },
        { status: 400 },
      );

    const languageProfile = await prisma.languageProfile.findUnique({
      where: {
        userId_language: {
          userId: user.id,
          language: targetLanguage,
        },
      },
    });

    if (!languageProfile) {
      return NextResponse.json(
        { error: "User profile for this language is not complete" },
        { status: 400 },
      );
    }

    const aiService = getAIService();
    const { result: topics } = await aiService.generateTopics(
      {
        targetLanguage: targetLanguage,
        proficiency: languageProfile.aiAssessedProficiency,
        count: 5,
      },
      user.id,
    );

    const safeTopics = Array.isArray(topics) ? topics : [];
    if (!Array.isArray(topics)) {
      logger.error("AI service did not return an array for topics", { topics });
    }

    const newTopicsData = safeTopics.map((title) => ({
      userId: user.id,
      title,
      targetLanguage,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.suggestedTopic.deleteMany({
        where: {
          userId: user.id,
          targetLanguage,
        },
      });
      if (newTopicsData.length > 0) {
        await tx.suggestedTopic.createMany({
          data: newTopicsData,
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ topics: safeTopics });
  } catch (error) {
    logger.error("Error generating topics:", error);
    return NextResponse.json(
      { error: "Failed to generate topics" },
      { status: 500 },
    );
  }
}