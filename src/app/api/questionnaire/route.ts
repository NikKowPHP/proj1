import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import questionnaireData from "@/lib/assessment-questions.json";

type Locale = "en" | "pl";

/**
 * A recursive function that traverses a JSON-like object and projects
 * internationalized fields to a specific locale.
 * @param node - The current object or value to process.
 * @param locale - The target locale ('en' or 'pl').
 * @returns The processed object with locale-specific strings.
 */
const project = (node: any, locale: Locale): any => {
  if (Array.isArray(node)) {
    return node.map((item) => project(item, locale));
  }
  if (node !== null && typeof node === "object") {
    // Check for a simple i18n string object: {en: '...', pl: '...'}
    if (typeof node.en === "string" && typeof node.pl === "string") {
      return node[locale];
    }

    const newNode: { [key: string]: any } = {};
    for (const key in node) {
      if (key === "options" && Array.isArray(node[key])) {
        newNode[key] = node[key].map((opt: any) => {
          const label =
            typeof opt.label === "object" && opt.label !== null
              ? opt.label[locale]
              : opt.label;

          if (opt.id) { // CheckboxOption {id, label}
            return { ...opt, label: label };
          }
          if (opt.value) { // Select option {value, label}
            return { value: opt.value, label: label || opt.value };
          }
          // Fallback for simple label object or string (e.g. ["Yes", "No"])
          return label || opt;
        });
      } else {
        newNode[key] = project(node[key], locale);
      }
    }
    return newNode;
  }
  return node;
};

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale") || "en";
  const supportedLocales: Locale[] = ["en", "pl"];
  const finalLocale: Locale = supportedLocales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : "en";

  try {
    const localizedQuestionnaire = project(questionnaireData, finalLocale);
    logger.info(`[API:questionnaire] Processed questionnaire for locale: ${finalLocale}`);
    return NextResponse.json(localizedQuestionnaire);
  } catch (error) {
    logger.error(`Error processing questionnaire for locale: ${finalLocale}`, error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 },
    );
  }
}
