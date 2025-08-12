import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getAIService } from "@/lib/ai";
import { ReadingLevel } from "@prisma/client";
import { encrypt } from "@/lib/encryption";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  logger.info(`/api/user/onboard - POST - User: ${user.id}`, body);

  const {
    nativeLanguage,
    targetLanguage,
    writingStyle,
    writingPurpose,
    selfAssessedLevel,
  } = body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        nativeLanguage,
        writingStyle,
        writingPurpose,
        selfAssessedLevel,
        defaultTargetLanguage: targetLanguage,
        languageProfiles: {
          upsert: {
            where: {
              userId_language: {
                userId: user.id,
                language: targetLanguage,
              },
            },
            create: {
              language: targetLanguage,
            },
            update: {},
          },
        },
      },
    });

    // Asynchronously generate initial reading material without blocking the response
    if (targetLanguage) {
      (async () => {
        try {
          const existingMaterial = await prisma.readingMaterial.findFirst({
            where: {
              targetLanguage: targetLanguage,
              level: ReadingLevel.BEGINNER,
            },
          });

          if (!existingMaterial) {
            logger.info(
              `No beginner reading material found for ${targetLanguage}. Generating...`,
            );
            const aiService = getAIService();
            const { result: material } =
              await aiService.generateReadingMaterial(
                targetLanguage,
                ReadingLevel.BEGINNER,
                user.id,
              );
            await prisma.readingMaterial.create({
              data: {
                title: encrypt(material.title),
                content: encrypt(material.content),
                targetLanguage: targetLanguage,
                level: ReadingLevel.BEGINNER,
                source: "AI Generated",
              },
            });
            logger.info(
              `Successfully generated and saved beginner reading material for ${targetLanguage}.`,
            );
          }
        } catch (error) {
          logger.error(
            `Failed to generate background reading material for ${targetLanguage} during onboarding`,
            { error },
          );
        }
      })(); // Fire-and-forget
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error("Failed to update user profile on onboarding", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}