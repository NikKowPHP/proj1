
"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { ArrowRightLeft } from "lucide-react";

interface LanguageSelectorPanelProps {
  sourceLang: string | null;
  targetLang: string | null;
  allUserLanguages: string[];
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  onSwap: () => void;
}

function getLanguageName(value: string) {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
  return lang ? lang.name : value;
}

export function LanguageSelectorPanel({
  sourceLang,
  targetLang,
  allUserLanguages,
  onSourceChange,
  onTargetChange,
  onSwap,
}: LanguageSelectorPanelProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Select value={sourceLang || ""} onValueChange={onSourceChange}>
        <SelectTrigger>
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {allUserLanguages.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {getLanguageName(lang)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        onClick={onSwap}
        aria-label="Swap languages"
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>
      <Select value={targetLang || ""} onValueChange={onTargetChange}>
        <SelectTrigger>
          <SelectValue placeholder="Target" />
        </SelectTrigger>
        <SelectContent>
          {allUserLanguages.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {getLanguageName(lang)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}