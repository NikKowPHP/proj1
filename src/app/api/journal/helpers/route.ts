import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getAIService } from "@/lib/ai";
import { logger } from "@/lib/logger";
import { getChallengingConcepts } from "@/lib/services/practice.service";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, targetLanguage } = await req.json();

    if (!topic || !targetLanguage) {
      return NextResponse.json(
        { error: "Topic and targetLanguage are required" },
        { status: 400 },
      );
    }

    const [languageProfile, challengingConcepts] = await Promise.all([
      prisma.languageProfile.findUnique({
        where: {
          userId_language: {
            userId: user.id,
            language: targetLanguage,
          },
        },
        select: { aiAssessedProficiency: true },
      }),
      getChallengingConcepts(user.id, targetLanguage),
    ]);

    const proficiency = languageProfile?.aiAssessedProficiency || 2.0;

    const aiService = getAIService();
    const { result: aids } = await aiService.generateJournalingAids(
      {
        topic,
        targetLanguage: targetLanguage,
        proficiency: proficiency,
        struggles:
          challengingConcepts.length > 0 ? challengingConcepts : undefined,
      },
      undefined,
    );

    return NextResponse.json(aids);
  } catch (error) {
    logger.error("Error generating journaling aids:", error);
    return NextResponse.json(
      { error: "Failed to generate journaling aids" },
      { status: 500 },
    );
  }
}