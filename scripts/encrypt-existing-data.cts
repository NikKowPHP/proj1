import { PrismaClient, JournalEntry, Analysis, Mistake } from "@prisma/client";
import { encrypt } from "../src/lib/encryption";
import { logger } from "../src/lib/logger";

const prisma = new PrismaClient();
const BATCH_SIZE = 100;

async function migrateJournalEntries() {
  logger.info("Starting migration for JournalEntry...");
  const totalCount = await prisma.journalEntry.count({
    where: { contentEncrypted: null },
  });
  logger.info(`Found ${totalCount} JournalEntries to migrate.`);

  if (totalCount === 0) {
    logger.info("No JournalEntries to migrate.");
    return;
  }

  let processedCount = 0;
  let batchNumber = 1;
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const entries: JournalEntry[] = await prisma.journalEntry.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: {
        contentEncrypted: null,
      },
      orderBy: {
        id: "asc",
      },
    });

    if (entries.length === 0) {
      hasMore = false;
      continue;
    }

    logger.info(
      `Processing JournalEntry batch ${batchNumber} (${entries.length} records)...`,
    );
    for (const entry of entries) {
      const encryptedContent = encrypt(entry.content);
      await prisma.journalEntry.update({
        where: { id: entry.id },
        data: {
          contentEncrypted: encryptedContent,
        },
      });
      processedCount++;
    }

    logger.info(`Processed ${processedCount} of ${totalCount} records.`);
    batchNumber++;

    cursor = entries[entries.length - 1].id;
    if (entries.length < BATCH_SIZE) {
      hasMore = false;
    }
  }
  logger.info("JournalEntry migration complete.");
}

async function migrateAnalyses() {
  logger.info("Starting migration for Analysis...");
  const totalCount = await prisma.analysis.count({
    where: { OR: [{ feedbackJsonEncrypted: null }, { rawAiResponseEncrypted: null }] },
  });
  logger.info(`Found ${totalCount} Analyses to migrate.`);

  if (totalCount === 0) {
    logger.info("No Analyses to migrate.");
    return;
  }

  let processedCount = 0;
  let batchNumber = 1;
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const analyses: Analysis[] = await prisma.analysis.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: {
        OR: [{ feedbackJsonEncrypted: null }, { rawAiResponseEncrypted: null }],
      },
      orderBy: {
        id: "asc",
      },
    });

    if (analyses.length === 0) {
      hasMore = false;
      continue;
    }

    logger.info(
      `Processing Analysis batch ${batchNumber} (${analyses.length} records)...`,
    );
    for (const analysis of analyses) {
      const encryptedFeedback = encrypt(JSON.stringify(analysis.feedbackJson));
      const encryptedRawResponse = encrypt(
        JSON.stringify(analysis.rawAiResponse),
      );

      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          feedbackJsonEncrypted: encryptedFeedback,
          rawAiResponseEncrypted: encryptedRawResponse,
        },
      });
      processedCount++;
    }
    logger.info(`Processed ${processedCount} of ${totalCount} records.`);
    batchNumber++;

    cursor = analyses[analyses.length - 1].id;
    if (analyses.length < BATCH_SIZE) {
      hasMore = false;
    }
  }
  logger.info("Analysis migration complete.");
}

async function migrateMistakes() {
  logger.info("Starting migration for Mistake...");
  const totalCount = await prisma.mistake.count({
    where: {
      OR: [
        { originalTextEncrypted: null },
        { correctedTextEncrypted: null },
        { explanationEncrypted: null },
      ],
    },
  });
  logger.info(`Found ${totalCount} Mistakes to migrate.`);

  if (totalCount === 0) {
    logger.info("No Mistakes to migrate.");
    return;
  }

  let processedCount = 0;
  let batchNumber = 1;
  let hasMore = true;
  let cursor: string | undefined = undefined;

  while (hasMore) {
    const mistakes: Mistake[] = await prisma.mistake.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: {
        OR: [
          { originalTextEncrypted: null },
          { correctedTextEncrypted: null },
          { explanationEncrypted: null },
        ],
      },
      orderBy: {
        id: "asc",
      },
    });

    if (mistakes.length === 0) {
      hasMore = false;
      continue;
    }

    logger.info(
      `Processing Mistake batch ${batchNumber} (${mistakes.length} records)...`,
    );
    for (const mistake of mistakes) {
      await prisma.mistake.update({
        where: { id: mistake.id },
        data: {
          originalTextEncrypted: encrypt(mistake.originalText),
          correctedTextEncrypted: encrypt(mistake.correctedText),
          explanationEncrypted: encrypt(mistake.explanation),
        },
      });
      processedCount++;
    }
    logger.info(`Processed ${processedCount} of ${totalCount} records.`);
    batchNumber++;
    cursor = mistakes[mistakes.length - 1].id;
    if (mistakes.length < BATCH_SIZE) {
      hasMore = false;
    }
  }
  logger.info("Mistake migration complete.");
}

async function main() {
  logger.info("Starting data encryption migration...");

  if (!process.env.APP_ENCRYPTION_KEY) {
    logger.error("FATAL: APP_ENCRYPTION_KEY is not set. Aborting migration.");
    process.exit(1);
  }

  await migrateJournalEntries();
  await migrateAnalyses();
  await migrateMistakes();

  logger.info("Data encryption migration finished successfully.");
}

main()
  .catch((e) => {
    logger.error("An error occurred during migration:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });