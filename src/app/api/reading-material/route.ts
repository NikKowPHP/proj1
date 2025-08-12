import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { decrypt, encrypt } from "@/lib/encryption";
import { ReadingLevel } from "@prisma/client";
import { z } from "zod";
import { getAIService } from "@/lib/ai";

const schema = z.object({
  targetLanguage: z.string().min(1, { message: "targetLanguage is required" }),
});

function getLevelFromProficiency(proficiency: number): ReadingLevel {
  if (proficiency < 40) return ReadingLevel.BEGINNER;
  if (proficiency < 75) return ReadingLevel.INTERMEDIATE;
  return ReadingLevel.ADVANCED;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const validation = schema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { targetLanguage } = validation.data;

    const languageProfile = await prisma.languageProfile.findUnique({
      where: { userId_language: { userId: user.id, language: targetLanguage } },
    });

    const level = getLevelFromProficiency(
      languageProfile?.aiAssessedProficiency ?? 2.0,
    );

    const count = await prisma.readingMaterial.count({
      where: { targetLanguage, level },
    });

    let material;

    if (count === 0) {
      logger.info(
        `No reading material found for ${targetLanguage} at level ${level}. Generating one...`,
      );
      try {
        const aiService = getAIService();
        const { result: generatedMaterial } =
          await aiService.generateReadingMaterial(targetLanguage, level, user.id);

        material = await prisma.readingMaterial.create({
          data: {
            title: encrypt(generatedMaterial.title),
            content: encrypt(generatedMaterial.content),
            targetLanguage: targetLanguage,
            level: level,
            source: "AI Generated (on-demand)",
          },
        });
        logger.info(
          `Successfully generated and saved new reading material for ${targetLanguage} at level ${level}.`,
        );
      } catch (generationError) {
        logger.error(
          "On-demand reading material generation failed.",
          generationError,
        );
        return NextResponse.json(
          { error: "Could not generate reading material at this time." },
          { status: 503 },
        );
      }
    } else {
      const skip = Math.floor(Math.random() * count);
      material = await prisma.readingMaterial.findFirst({
        where: { targetLanguage, level },
        skip,
      });
    }

    if (!material) {
      return NextResponse.json(
        { error: "Could not retrieve reading material." },
        { status: 500 },
      );
    }

    const decryptedMaterial = {
      ...material,
      title: decrypt(material.title),
      content: decrypt(material.content),
    };

    return NextResponse.json(decryptedMaterial);
  } catch (error) {
    logger.error("Error fetching reading material:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading material" },
      { status: 500 },
    );
  }
}