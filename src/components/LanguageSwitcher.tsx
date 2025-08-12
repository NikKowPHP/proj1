"use client";

import { useUserProfile } from "@/lib/hooks/data";
import { useLanguageStore } from "@/lib/stores/language.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

function getLanguageName(value: string) {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
  return lang ? lang.name : value;
}

export function LanguageSwitcher() {
  const { data: userProfile, isLoading } = useUserProfile();
  const { activeTargetLanguage, setActiveTargetLanguage } = useLanguageStore();

  if (isLoading) {
    return <Skeleton className="h-9 w-40" />;
  }

  if (
    !userProfile?.languageProfiles ||
    userProfile.languageProfiles.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Learning:
      </span>
      <Select
        value={activeTargetLanguage || ""}
        onValueChange={(lang) => {
          if (lang) setActiveTargetLanguage(lang);
        }}
      >
        <SelectTrigger className="w-fit">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent>
          {userProfile.languageProfiles.map((profile: { language: string }) => (
            <SelectItem key={profile.language} value={profile.language}>
              {getLanguageName(profile.language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
