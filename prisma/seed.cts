import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import questionnaireData from "../src/lib/assessment-questions.json";

const prisma = new PrismaClient();

const project = (node: any, locale: "en" | "pl"): any => {
  if (Array.isArray(node)) {
    return node.map((item) => project(item, locale));
  }
  if (node !== null && typeof node === "object") {
    // Check for an i18n string object: {en: '...', pl: '...'} or a simpler value/label object
    if (typeof node.en === "string" && typeof node.pl === "string") {
      return node[locale];
    }

    const newNode: { [key: string]: any } = {};
    for (const key in node) {
      if (key === "options" && Array.isArray(node[key])) {
        // Options are transformed from {value, label} objects to simple strings
        newNode[key] = node[key].map((opt: any) => {
          const label =
            typeof opt.label === "object" && opt.label !== null
              ? opt.label[locale]
              : opt.label;
          // The value for the select is the localized label
          return label;
        });
      } else {
        newNode[key] = project(node[key], locale);
      }
    }
    return newNode;
  }
  return node;
};

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
    const enQuestionnaireContent = project(questionnaireData, "en");

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
    console.log(
      "Successfully seeded and activated questionnaire version 2 (English).",
    );
  } catch (error) {
    console.error("Failed to seed English questionnaire v2:", error);
  }

  // Seed Polish questionnaire (v3)
  try {
    console.log("Seeding Polish questionnaire (v3)...");
    const plQuestionnaireContent = project(questionnaireData, "pl");

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
