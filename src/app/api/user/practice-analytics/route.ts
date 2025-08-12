// src/app/api/user/practice-analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";

const MIN_ATTEMPTS_FOR_ANALYTICS = 3;
const TOP_N_CONCEPTS = 3;
const CHALLENGING_SCORE_THRESHOLD = 85;

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
    const schema = z.object({
      targetLanguage: z
        .string()
        .min(1, { message: "targetLanguage is required" }),
    });
    const validation = schema.safeParse({ targetLanguage });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Use Prisma's aggregation capabilities
    const attemptsByMistake = await prisma.practiceAttempt.groupBy({
      by: ["mistakeId"],
      where: {
        userId: user.id,
        mistake: {
          analysis: {
            entry: {
              targetLanguage: validation.data.targetLanguage,
            },
          },
        },
      },
      _avg: {
        score: true,
      },
      _count: {
        id: true, // Use a non-nullable field like 'id' for counting
      },
      having: {
        id: {
          // Filter by the count of 'id'
          _count: {
            gte: MIN_ATTEMPTS_FOR_ANALYTICS,
          },
        },
      },
    });

    if (attemptsByMistake.length === 0) {
      return NextResponse.json([]); // No concepts meet the criteria
    }

    // Filter for concepts that are actually challenging, sort by score, and take top N
    const challengingConcepts = attemptsByMistake
      .filter(
        (concept) =>
          (concept._avg.score ?? 100) < CHALLENGING_SCORE_THRESHOLD,
      )
      .sort((a, b) => (a._avg?.score ?? 100) - (b._avg?.score ?? 100))
      .slice(0, TOP_N_CONCEPTS);

    if (challengingConcepts.length === 0) {
      return NextResponse.json([]);
    }

    const mistakeIds = challengingConcepts.map((c) => c.mistakeId);

    // Fetch the details for the identified mistakes
    const mistakes = await prisma.mistake.findMany({
      where: {
        id: { in: mistakeIds },
      },
      select: {
        id: true,
        explanation: true,
        originalText: true,
        correctedText: true,
      },
    });

    // Combine the aggregated data with mistake details
    const result = challengingConcepts
      .map((concept) => {
        const mistakeDetails = mistakes.find((m) => m.id === concept.mistakeId);
        if (!mistakeDetails) return null;

        const decryptedExplanation = decrypt(mistakeDetails.explanation);
        const decryptedOriginal = decrypt(mistakeDetails.originalText);
        const decryptedCorrected = decrypt(mistakeDetails.correctedText);

        if (
          decryptedExplanation === null ||
          decryptedOriginal === null ||
          decryptedCorrected === null
        ) {
          logger.error(
            `Failed to decrypt data for mistake ${mistakeDetails.id}`,
          );
          return null;
        }

        return {
          mistakeId: concept.mistakeId,
          averageScore: concept._avg?.score ?? null,
          attempts: concept._count?.id ?? 0,
          explanation: decryptedExplanation,
          originalText: decryptedOriginal,
          correctedText: decryptedCorrected,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching practice analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice analytics" },
      { status: 500 },
    );
  }
}