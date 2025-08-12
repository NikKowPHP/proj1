/** @jest-environment node */

import { SUPPORTED_LANGUAGES } from "./constants";
import { onboardingPrompts } from "./translations";

describe("Onboarding Prompts Translations", () => {
  it("should have a translation for every supported language", () => {
    const promptKeys = Object.keys(onboardingPrompts.introduceYourselfV2);
    const missingLanguages: string[] = [];

    SUPPORTED_LANGUAGES.forEach((lang) => {
      if (!promptKeys.includes(lang.value)) {
        missingLanguages.push(lang.name);
      }
    });

    expect(missingLanguages).toEqual([]);
  });
});