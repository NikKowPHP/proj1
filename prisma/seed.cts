import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  try {
    const filePath = path.join(
      __dirname,
      "../src/lib/assessment-questions.json",
    );
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const questionnaireContent = JSON.parse(fileContent);

    // Deactivate all other versions first
    await prisma.questionnaire.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Upsert version 1
    await prisma.questionnaire.upsert({
      where: { version: 1 },
      update: {
        content: questionnaireContent,
        isActive: true,
      },
      create: {
        version: 1,
        content: questionnaireContent,
        isActive: true,
      },
    });

    console.log("Successfully seeded and activated questionnaire version 1.");
  } catch (error) {
    console.error("Failed to seed questionnaire:", error);
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