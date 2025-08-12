
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LanguageState {
  activeTargetLanguage: string | null;
  setActiveTargetLanguage: (language: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      activeTargetLanguage: null,
      setActiveTargetLanguage: (language) =>
        set({ activeTargetLanguage: language }),
    }),
    {
      name: "lexity-language-storage", // key in localStorage
    },
  ),
);