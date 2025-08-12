// src/lib/services/analytics.service.ts
import { prisma } from "@/lib/db";
import { forecast } from "@/lib/utils/forecasting";
import { decrypt } from "../encryption";
import { logger } from "../logger";
import { getChallengingConcepts } from "./practice.service";
import type { UserProficiencySnapshot } from "../types";

const MIN_ENTRIES_FOR_FORECAST = 7;
const DEFAULT_PREDICTION_DAYS = 30;

// --- Data Types ---
interface Point {
  date: string;
  score: number;
}
interface SubskillPoint {
  date: string;
  grammar: number;
  phrasing: number;
  vocabulary: number;
}
interface AnalyticsData {
  totalEntries: number;
  averageScore: number;
  weakestSkill: string;
  proficiencyOverTime: Point[];
  subskillScores: { grammar: number; phrasing: number; vocabulary: number };
  recentJournals: any[]; // Kept as any to match previous structure
  subskillProficiencyOverTime: SubskillPoint[];
  predictedProficiencyOverTime: Point[];
  predictedSubskillProficiencyOverTime: SubskillPoint[];
  journalsThisWeek: number;
  dueCounts: {
    today: number;
    tomorrow: number;
    week: number;
  };
}


// --- Main Service Function ---

export async function getAnalyticsData(
  userId: string,
  targetLanguage: string,
  predictionHorizonDays: number = DEFAULT_PREDICTION_DAYS,
): Promise<AnalyticsData> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [analyses, languageProfile, recentJournalsFromDb] = await Promise.all([
    prisma.analysis.findMany({
      where: { entry: { authorId: userId, targetLanguage } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.languageProfile.findUnique({
      where: { userId_language: { userId, language: targetLanguage } },
    }),
    prisma.journalEntry.findMany({
      where: { authorId: userId, targetLanguage },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { topic: true },
    }),
  ]);

  const totalAnalyses = analyses.length;

  const recentJournals = recentJournalsFromDb
    .map((journal) => {
      const decryptedContent = decrypt(journal.content);
      if (decryptedContent === null) {
        logger.error(
          `Failed to decrypt recent journal entry content for id: ${journal.id}. Skipping.`,
        );
        return null;
      }
      return { ...journal, content: decryptedContent };
    })
    .filter((j): j is NonNullable<typeof j> => j !== null);
  
  const journalsThisWeek = analyses.filter(a => new Date(a.createdAt) >= oneWeekAgo).length;

  // --- SRS Due Counts ---
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  const dayAfterTomorrowStart = new Date(tomorrowStart);
  dayAfterTomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const endOfWeek = new Date(todayStart);
  endOfWeek.setDate(todayStart.getDate() + (7 - todayStart.getDay()));

  const [dueToday, dueTomorrow, dueThisWeek] = await Promise.all([
    prisma.srsReviewItem.count({ where: { userId, targetLanguage, nextReviewAt: { lte: tomorrowStart } } }),
    prisma.srsReviewItem.count({ where: { userId, targetLanguage, nextReviewAt: { gte: tomorrowStart, lt: dayAfterTomorrowStart } } }),
    prisma.srsReviewItem.count({ where: { userId, targetLanguage, nextReviewAt: { lte: endOfWeek } } }),
  ]);

  const dueCounts = {
    today: dueToday,
    tomorrow: dueTomorrow,
    week: dueThisWeek,
  };


  const defaultResponse: AnalyticsData = {
    totalEntries: totalAnalyses,
    averageScore: languageProfile?.aiAssessedProficiency || 0,
    weakestSkill: "N/A",
    proficiencyOverTime: [],
    subskillScores: { grammar: 0, phrasing: 0, vocabulary: 0 },
    recentJournals,
    subskillProficiencyOverTime: [],
    predictedProficiencyOverTime: [],
    predictedSubskillProficiencyOverTime: [],
    journalsThisWeek,
    dueCounts,
  };

  if (totalAnalyses === 0) {
    return defaultResponse;
  }

  // --- Calculate Aggregates ---
  const subskillScores = {
    grammar: analyses.reduce((sum, a) => sum + a.grammarScore, 0) / totalAnalyses,
    phrasing: analyses.reduce((sum, a) => sum + a.phrasingScore, 0) / totalAnalyses,
    vocabulary: analyses.reduce((sum, a) => sum + a.vocabScore, 0) / totalAnalyses,
  };

  const weakestSkill = Object.keys(subskillScores).reduce((a, b) =>
    subskillScores[a as keyof typeof subskillScores] < subskillScores[b as keyof typeof subskillScores] ? a : b,
  );

  // --- Format Historical Data ---
  const proficiencyOverTime: Point[] = analyses.map((a) => ({
    date: a.createdAt.toISOString(),
    score: (a.grammarScore + a.phrasingScore + a.vocabScore) / 3,
  }));
  const subskillProficiencyOverTime: SubskillPoint[] = analyses.map((a) => ({
    date: a.createdAt.toISOString(),
    grammar: a.grammarScore,
    phrasing: a.phrasingScore,
    vocabulary: a.vocabScore,
  }));

  // --- Calculate Predictions ---
  let predictedProficiencyOverTime: Point[] = [];
  const predictedSubskillProficiencyOverTime: SubskillPoint[] = [];

  if (totalAnalyses >= MIN_ENTRIES_FOR_FORECAST) {
    const timeDiffs = analyses.slice(1).map((a, i) => a.createdAt.getTime() - analyses[i].createdAt.getTime());
    const avgTimeBetweenEntries = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    const paceInDays = Math.max(0.1, avgTimeBetweenEntries / (1000 * 60 * 60 * 24));
    const lastEntryDate = analyses[totalAnalyses - 1].createdAt;

    // Calculate how many entries to forecast based on the user's pace and the desired calendar horizon
    const entriesToForecast = Math.ceil(predictionHorizonDays / paceInDays);


    const generateSkillPrediction = (data: number[]): number[] => {
      return forecast(data, entriesToForecast);
    };

    const overallScores = proficiencyOverTime.map(p => p.score);
    const predictedScores = generateSkillPrediction(overallScores);

    predictedProficiencyOverTime = predictedScores.map((score, i) => {
      const futureDate = new Date(lastEntryDate.getTime() + (i + 1) * avgTimeBetweenEntries);
      return { date: futureDate.toISOString(), score };
    });

    const grammarScores = subskillProficiencyOverTime.map(p => p.grammar);
    const phrasingScores = subskillProficiencyOverTime.map(p => p.phrasing);
    const vocabScores = subskillProficiencyOverTime.map(p => p.vocabulary);

    const grammarPredictions = generateSkillPrediction(grammarScores);
    const phrasingPredictions = generateSkillPrediction(phrasingScores);
    const vocabPredictions = generateSkillPrediction(vocabScores);

    for (let i = 0; i < entriesToForecast; i++) {
      if (predictedProficiencyOverTime[i]) {
        predictedSubskillProficiencyOverTime.push({
          date: predictedProficiencyOverTime[i].date,
          grammar: grammarPredictions[i],
          phrasing: phrasingPredictions[i],
          vocabulary: vocabPredictions[i],
        });
      }
    }
  }

  return {
    ...defaultResponse,
    weakestSkill,
    proficiencyOverTime,
    subskillScores,
    subskillProficiencyOverTime,
    predictedProficiencyOverTime,
    predictedSubskillProficiencyOverTime,
  };
}

export async function getUserProficiencySnapshot(
  userId: string,
  targetLanguage: string,
): Promise<UserProficiencySnapshot> {
  const analyses = await prisma.analysis.findMany({
    where: { entry: { authorId: userId, targetLanguage } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { grammarScore: true, phrasingScore: true, vocabScore: true },
  });

  if (analyses.length < 2) {
    return {
      averageScore: 0,
      trend: "new",
      challengingConcepts: [],
    };
  }

  const calculateAverage = (arr: typeof analyses) => {
    if (arr.length === 0) return 0;
    const total = arr.reduce(
      (sum, a) => sum + (a.grammarScore + a.phrasingScore + a.vocabScore) / 3,
      0,
    );
    return total / arr.length;
  };

  const recentAnalyses = analyses.slice(0, 5);
  const olderAnalyses = analyses.slice(5, 10);

  const recentAvg = calculateAverage(recentAnalyses);
  const olderAvg =
    olderAnalyses.length > 0 ? calculateAverage(olderAnalyses) : recentAvg;

  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentAvg > olderAvg + 2) {
    trend = "improving";
  } else if (recentAvg < olderAvg - 2) {
    trend = "declining";
  }

  const challengingConceptsRaw = await getChallengingConcepts(
    userId,
    targetLanguage,
  );
  const challengingConcepts = challengingConceptsRaw.map((c) => ({
    explanation: c.explanation,
  }));

  return {
    averageScore: recentAvg,
    trend,
    challengingConcepts,
  };
}