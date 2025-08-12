import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

const MIN_ATTEMPTS_FOR_ANALYTICS = 3;
const TOP_N_CONCEPTS = 3;
const CHALLENGING_SCORE_THRESHOLD = 85;

export async function getChallengingConcepts(
  userId: string,
  targetLanguage: string,
) {
  try {
    const attemptsByMistake = await prisma.practiceAttempt.groupBy({
      by: ["mistakeId"],
      where: {
        userId: userId,
        mistake: {
          analysis: {
            entry: {
              targetLanguage: targetLanguage,
            },
          },
        },
      },
      _avg: {
        score: true,
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: MIN_ATTEMPTS_FOR_ANALYTICS,
          },
        },
      },
    });

    const challengingConcepts = attemptsByMistake
      .filter(
        (concept) =>
          (concept._avg.score ?? 100) < CHALLENGING_SCORE_THRESHOLD,
      )
      .sort((a, b) => (a._avg?.score ?? 100) - (b._avg?.score ?? 100))
      .slice(0, TOP_N_CONCEPTS);

    if (challengingConcepts.length === 0) {
      return [];
    }

    const mistakeIds = challengingConcepts.map((c) => c.mistakeId);

    const mistakes = await prisma.mistake.findMany({
      where: {
        id: { in: mistakeIds },
      },
      select: {
        id: true,
        explanation: true,
      },
    });

    const result = challengingConcepts
      .map((concept) => {
        const mistakeDetails = mistakes.find((m) => m.id === concept.mistakeId);
        if (!mistakeDetails) return null;

        const decryptedExplanation = decrypt(mistakeDetails.explanation);

        if (decryptedExplanation === null) {
          logger.error(
            `Failed to decrypt explanation for mistake ${mistakeDetails.id}`,
          );
          return null;
        }

        return {
          mistakeId: concept.mistakeId,
          explanation: decryptedExplanation,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return result;
  } catch (error) {
    logger.error("Error getting challenging concepts from service", { error });
    return [];
  }
}