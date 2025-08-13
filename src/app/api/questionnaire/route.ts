import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "en";
  const supportedLocales = ["en", "pl"];
  const finalLocale = supportedLocales.includes(locale) ? locale : "en";

  try {
    const filePath = path.join(
      process.cwd(),
      `src/lib/assessment-questions.${finalLocale}.json`,
    );
    const fileContent = await fs.readFile(filePath, "utf-8");
    const questionnaireContent = JSON.parse(fileContent);
    return NextResponse.json(questionnaireContent);
  } catch (error) {
    logger.error(`Error fetching questionnaire for locale: ${finalLocale}`, error);
    // Fallback to English if the requested locale file is missing
    if (finalLocale !== "en") {
      try {
        const fallbackFilePath = path.join(
          process.cwd(),
          `src/lib/assessment-questions.en.json`,
        );
        const fallbackFileContent = await fs.readFile(fallbackFilePath, "utf-8");
        const fallbackContent = JSON.parse(fallbackFileContent);
        return NextResponse.json(fallbackContent);
      } catch (fallbackError) {
        logger.error("Failed to fetch fallback questionnaire (en)", fallbackError);
      }
    }
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 },
    );
  }
}
