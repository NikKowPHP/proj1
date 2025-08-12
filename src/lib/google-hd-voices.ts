export const mapLanguageToGoogleHDVoice = (languageCode: string): string => {
  // This map uses the versatile Chirp3-HD-Aoede model, ensuring the correct
  // language-specific voice is selected based on the BCP-47 language code.
  const languageMap: Record<string, string> = {
    // European languages
    "de-DE": "de-DE-Chirp3-HD-Aoede",
    "fr-FR": "fr-FR-Chirp3-HD-Aoede",
    "es-ES": "es-ES-Chirp3-HD-Aoede",
    "it-IT": "it-IT-Chirp3-HD-Aoede",
    "pt-BR": "pt-BR-Chirp3-HD-Aoede",
    "pt-PT": "pt-PT-Chirp3-HD-Aoede",
    "nl-NL": "nl-NL-Chirp3-HD-Aoede",
    "pl-PL": "pl-PL-Chirp3-HD-Aoede",
    "sv-SE": "sv-SE-Chirp3-HD-Aoede",
    "da-DK": "da-DK-Chirp3-HD-Aoede",
    "nb-NO": "nb-NO-Chirp3-HD-Aoede",
    "fi-FI": "fi-FI-Chirp3-HD-Aoede",
    "cs-CZ": "cs-CZ-Chirp3-HD-Aoede",
    "sk-SK": "sk-SK-Chirp3-HD-Aoede",
    "hu-HU": "hu-HU-Chirp3-HD-Aoede",
    "ro-RO": "ro-RO-Chirp3-HD-Aoede",
    "el-GR": "el-GR-Chirp3-HD-Aoede",
    "en-US": "en-US-Chirp3-HD-Aoede",

    // Asian languages
    "ja-JP": "ja-JP-Chirp3-HD-Aoede",
    "ko-KR": "ko-KR-Chirp3-HD-Aoede",
    "zh-CN": "cmn-CN-Chirp3-HD-Aoede", // Mandarin
    "vi-VN": "vi-VN-Chirp3-HD-Aoede",
    "th-TH": "th-TH-Chirp3-HD-Aoede",
    "id-ID": "id-ID-Chirp3-HD-Aoede",
    "ms-MY": "ms-MY-Chirp3-HD-Aoede",
    "hi-IN": "hi-IN-Chirp3-HD-Aoede",
    "ta-IN": "ta-IN-Chirp3-HD-Aoede",
    "bn-IN": "bn-IN-Chirp3-HD-Aoede",

    // Middle Eastern languages
    "ar-XA": "ar-XA-Chirp3-HD-Aoede",
    "ar-SA": "ar-XA-Chirp3-HD-Aoede",
    "tr-TR": "tr-TR-Chirp3-HD-Aoede",
    "he-IL": "he-IL-Chirp3-HD-Aoede",
    "fa-IR": "fa-IR-Chirp3-HD-Aoede",

    // Other languages
    "ru-RU": "ru-RU-Chirp3-HD-Aoede",
    "uk-UA": "uk-UA-Chirp3-HD-Aoede",
    "fil-PH": "fil-PH-Chirp3-HD-Aoede",
    "sw-KE": "sw-KE-Chirp3-HD-Aoede",
  };

  return languageMap[languageCode] || "en-US-Chirp3-HD-Aoede";
};