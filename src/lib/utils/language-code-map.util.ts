
import { logger } from "@/lib/logger";

export function mapLanguageToCode(language: string): string {
  const languageMap: Record<string, string> = {
    english: "en-US",
    "english (us)": "en-US",
    "english (uk)": "en-GB",
    "english (australia)": "en-AU",
    "english (india)": "en-IN",
    german: "de-DE",
    french: "fr-FR",
    spanish: "es-ES",
    italian: "it-IT",
    portuguese: "pt-PT",
    "portuguese (brazil)": "pt-BR",
    dutch: "nl-NL",
    polish: "pl-PL",
    swedish: "sv-SE",
    danish: "da-DK",
    norwegian: "nb-NO",
    finnish: "fi-FI",
    czech: "cs-CZ",
    slovak: "sk-SK",
    hungarian: "hu-HU",
    romanian: "ro-RO",
    greek: "el-GR",
    japanese: "ja-JP",
    korean: "ko-KR",
    chinese: "cmn-CN",
    "chinese (mandarin)": "cmn-CN",
    "chinese (cantonese)": "yue-HK",
    vietnamese: "vi-VN",
    thai: "th-TH",
    indonesian: "id-ID",
    malay: "ms-MY",
    hindi: "hi-IN",
    tamil: "ta-IN",
    bengali: "bn-IN",
    arabic: "ar-XA",
    turkish: "tr-TR",
    hebrew: "he-IL",
    persian: "fa-IR",
    russian: "ru-RU",
    ukrainian: "uk-UA",
    filipino: "fil-PH",
    swahili: "sw-KE",
  };

  const normalizedLanguage = language.toLowerCase().trim();

  if (normalizedLanguage in languageMap) {
    return languageMap[normalizedLanguage];
  }

  for (const [key, code] of Object.entries(languageMap)) {
    if (
      normalizedLanguage.includes(key) ||
      key.includes(normalizedLanguage)
    ) {
      return code;
    }
  }

  logger.warn(
    `No language code mapping found for: ${language}, using en-US as default`,
  );
  return "en-US";
}