"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateSrsFromTranslation } from "@/lib/hooks/data";
import { PlusCircle, CheckCircle } from "lucide-react";
import Spinner from "./ui/Spinner";
import { useLanguageStore } from "@/lib/stores/language.store";

interface TranslationSegmentCardProps {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  translationLang: string;
  isAlreadyInDeck: boolean;
  explanation?: string;
}

export function TranslationSegmentCard({
  sourceText,
  translatedText,
  sourceLang,
  translationLang,
  isAlreadyInDeck,
  explanation,
}: TranslationSegmentCardProps) {
  const {
    mutate: addToDeck,
    isPending,
    isSuccess,
  } = useCreateSrsFromTranslation();
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );

  const handleAddToDeck = () => {
    if (!activeTargetLanguage) {
      console.error("Cannot add to deck, no active target language selected.");
      return;
    }

    let front = sourceText;
    let back = translatedText;

    // Standardize the card: front is always the language being learned.
    if (translationLang === activeTargetLanguage) {
      front = translatedText;
      back = sourceText;
    }

    addToDeck({
      frontContent: front,
      backContent: back,
      targetLanguage: activeTargetLanguage, // Always associate with the active language deck
      explanation: explanation,
    });
  };

  const showAddedState = isSuccess || isAlreadyInDeck;

  return (
    <Card className="p-4 bg-secondary/50">
      <CardContent className="p-0 flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">{sourceText}</p>
          <p className="text-sm font-medium">{translatedText}</p>
          {explanation && (
            <p className="text-xs text-muted-foreground italic mt-2">
              Tip: {explanation}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleAddToDeck}
          disabled={showAddedState || isPending}
          className="shrink-0"
        >
          {isPending ? (
            <Spinner size="sm" />
          ) : showAddedState ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <PlusCircle className="h-5 w-5" />
          )}
          <span className="sr-only">Add to deck</span>
        </Button>
      </CardContent>
    </Card>
  );
}