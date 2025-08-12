
export const mapLanguageToGoogleBasicVoice = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    // European languages
    "de-DE": "de-DE-Wavenet-F",
    "fr-FR": "fr-FR-Wavenet-A",
    "es-ES": "es-ES-Wavenet-C",
    "it-IT": "it-IT-Wavenet-A",
    "pt-BR": "pt-BR-Wavenet-A", // Common Portuguese variant
    "pt-PT": "pt-PT-Wavenet-A",
    "nl-NL": "nl-NL-Wavenet-B",
    "pl-PL": "pl-PL-Wavenet-A",
    "sv-SE": "sv-SE-Wavenet-A",
    "da-DK": "da-DK-Wavenet-A",
    "nb-NO": "nb-NO-Wavenet-E",
    "fi-FI": "fi-FI-Wavenet-A",
    "cs-CZ": "cs-CZ-Wavenet-A",
    "sk-SK": "sk-SK-Wavenet-A",
    "hu-HU": "hu-HU-Wavenet-A",
    "ro-RO": "ro-RO-Wavenet-A",
    "el-GR": "el-GR-Wavenet-A",
    "en-US": "en-US-Wavenet-D",

    // Asian languages
    "ja-JP": "ja-JP-Wavenet-B",
    "ko-KR": "ko-KR-Wavenet-A",
    "zh-CN": "cmn-CN-Wavenet-A", // Mandarin
    "vi-VN": "vi-VN-Wavenet-A",
    "th-TH": "th-TH-Wavenet-C",
    "id-ID": "id-ID-Wavenet-A",
    "ms-MY": "ms-MY-Wavenet-A",
    "hi-IN": "hi-IN-Wavenet-A",
    "ta-IN": "ta-IN-Wavenet-A",
    "bn-IN": "bn-IN-Wavenet-A",

    // Middle Eastern languages
    "ar-XA": "ar-XA-Wavenet-B", // Standard Arabic
    "ar-SA": "ar-XA-Wavenet-B",
    "tr-TR": "tr-TR-Wavenet-A",
    "he-IL": "he-IL-Wavenet-A",
    "fa-IR": "fa-IR-Wavenet-A",

    // Other languages
    "ru-RU": "ru-RU-Wavenet-D",
    "uk-UA": "uk-UA-Wavenet-A",
    "fil-PH": "fil-PH-Wavenet-A",
    "sw-KE": "sw-KE-Wavenet-A",
  };

  return languageMap[languageCode] || "en-US-Wavenet-D";
};