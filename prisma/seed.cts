import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with questionnaires...");

  // Deactivate all existing questionnaires
  await prisma.questionnaire.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });
  console.log("Deactivated all existing active questionnaires.");

  // Seed English questionnaire (v2)
  try {
    console.log("Seeding English questionnaire (v2)...");
    const enFilePath = path.join(
      __dirname,
      "../src/lib/assessment-questions.en.json",
    );
    const enFileContent = fs.readFileSync(enFilePath, "utf-8");
    const enQuestionnaireContent = JSON.parse(enFileContent);

    await prisma.questionnaire.upsert({
      where: { version: 2 },
      update: {
        content: enQuestionnaireContent,
        isActive: true, // English is the active default
      },
      create: {
        version: 2,
        content: enQuestionnaireContent,
        isActive: true,
      },
    });
    console.log("Successfully seeded and activated questionnaire version 2 (English).");
  } catch (error) {
    console.error("Failed to seed English questionnaire v2:", error);
  }

  // Seed Polish questionnaire (v3)
  try {
    console.log("Seeding Polish questionnaire (v3)...");
    const plFilePath = path.join(
      __dirname,
      "../src/lib/assessment-questions.pl.json",
    );
    const plFileContent = fs.readFileSync(plFilePath, "utf-8");
    const plQuestionnaireContent = JSON.parse(plFileContent);

    await prisma.questionnaire.upsert({
      where: { version: 3 },
      update: {
        content: plQuestionnaireContent,
        isActive: false, // Polish is seeded but not active by default
      },
      create: {
        version: 3,
        content: plQuestionnaireContent,
        isActive: false,
      },
    });
    console.log("Successfully seeded questionnaire version 3 (Polish).");
  } catch (error) {
    console.error("Failed to seed Polish questionnaire v3:", error);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
      