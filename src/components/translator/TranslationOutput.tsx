"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/Spinner";
import { TranslationSegmentCard } from "@/components/TranslationSegmentCard";
import { TTSButton } from "@/components/ui/TTSButton";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

interface Segment {
  source: string;
  translation: string;
  explanation: string;
}

interface TranslationOutputProps {
  sourceLang: string | null;
  targetLang: string | null;
  translatedText: string;
  isBreakingDown: boolean;
  segments: Segment[] | null;
  studyDeckSet: Set<string>;
}

function getLanguageCode(value: string | null): string {
  if (!value) return "";
  const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
  // Fallback to a BCP-47 style code if available, e.g., for English 'en-US'
  return lang?.code || value;
}

export function TranslationOutput({
  sourceLang,
  targetLang,
  translatedText,
  isBreakingDown,
  segments,
  studyDeckSet,
}: TranslationOutputProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Translation & Breakdown</CardTitle>
          {translatedText && (
            <TTSButton
              text={translatedText}
              lang={getLanguageCode(targetLang)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Translation will appear here..."
          value={translatedText}
          readOnly
          rows={8}
          className="bg-muted"
        />
        <div className="space-y-2 max-h-[calc(60vh-200px)] overflow-y-auto">
          {isBreakingDown && !segments && <Spinner />}
          {!segments && !isBreakingDown && (
            <p className="text-muted-foreground text-center py-10">
              Translate a paragraph to see sentence-by-sentence breakdowns here.
            </p>
          )}
          {segments?.map((segment, index) => (
            <TranslationSegmentCard
              key={index}
              sourceText={segment.source}
              translatedText={segment.translation}
              explanation={segment.explanation}
              sourceLang={sourceLang!}
              translationLang={targetLang!}
              isAlreadyInDeck={studyDeckSet.has(segment.source)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}