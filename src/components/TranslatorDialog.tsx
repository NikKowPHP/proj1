"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "./ui/textarea";
import {
  useUserProfile,
  useContextualTranslate,
  useCreateSrsFromTranslation,
} from "@/lib/hooks/data";
import { useLanguageStore } from "@/lib/stores/language.store";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { ArrowRightLeft, Loader2, Check } from "lucide-react";
import Spinner from "./ui/Spinner";

interface TranslatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTranslation?: (text: string) => void;
  onTranslate?: (details: {
    sourceText: string;
    translatedText: string;
    explanation: string | null;
  }) => void;
}

function getLanguageName(value: string | null | undefined): string {
  if (!value) return "";
  const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
  return lang ? lang.name : value;
}

export function TranslatorDialog({
  open,
  onOpenChange,
  onApplyTranslation,
  onTranslate,
}: TranslatorDialogProps) {
  const { data: userProfile } = useUserProfile();
  const { activeTargetLanguage } = useLanguageStore();
  const translateMutation = useContextualTranslate();
  const {
    mutate: addToDeck,
    reset: resetAddToDeck,
    isPending: isAddingToDeck,
    isSuccess: isAddedToDeck,
  } = useCreateSrsFromTranslation();

  const [sourceLang, setSourceLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSourceLang(userProfile?.nativeLanguage || null);
      setTargetLang(activeTargetLanguage);
      setSourceText("");
      setTranslatedText("");
      setExplanation(null);
      resetAddToDeck();
    }
  }, [open, userProfile, activeTargetLanguage, resetAddToDeck]);

  const handleTranslate = () => {
    if (sourceText.trim() && sourceLang && targetLang) {
      setExplanation(null);
      translateMutation.mutate(
        {
          selectedText: sourceText,
          context: sourceText,
          sourceLanguage: getLanguageName(sourceLang),
          targetLanguage: getLanguageName(targetLang),
        },
        {
          onSuccess: (data) => {
            setTranslatedText(data.translation);
            if (data.explanation) {
              setExplanation(data.explanation);
            }
            resetAddToDeck(); // Allow adding new translation to deck
            onTranslate?.({
              sourceText,
              translatedText: data.translation,
              explanation: data.explanation || null,
            });
          },
        },
      );
    }
  };

  const handleSwapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);

    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
    setExplanation(null);
  };

  const handleAddToDeck = () => {
    if (sourceText && translatedText && sourceLang && targetLang && activeTargetLanguage) {
      let front: string;
      let back: string;

      // Standardize the card: front is always the target language being learned.
      if (sourceLang === activeTargetLanguage) {
        front = sourceText;
        back = translatedText;
      } else { // Assume targetLang is the activeTargetLanguage, or handle other cases
        front = translatedText;
        back = sourceText;
      }

      addToDeck({
        frontContent: front,
        backContent: back,
        targetLanguage: activeTargetLanguage,
        explanation: explanation ?? undefined,
      });
    }
  };


  const handleApplyToJournal = () => {
    if (onApplyTranslation && translatedText) {
      onApplyTranslation(translatedText);
      onOpenChange(false);
    }
  };

  const isAddToDeckDisabled =
    !translatedText || isAddingToDeck || isAddedToDeck;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Translator</DialogTitle>
          <DialogDescription>
            Translate text between your languages. Add translations to your
            study deck for review.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-grow flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 flex-grow">
            <div className="space-y-2 flex flex-col">
              <div className="flex items-center justify-center font-semibold">
                {getLanguageName(sourceLang)}
              </div>
              <Textarea
                placeholder={`Text in ${getLanguageName(sourceLang)}...`}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="resize-none flex-grow"
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <div className="flex items-center justify-center font-semibold">
                {getLanguageName(targetLang)}
              </div>
              <Textarea
                placeholder="Translation"
                value={translatedText}
                readOnly
                className="resize-none bg-muted/50 flex-grow"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <Button variant="ghost" onClick={handleSwapLanguages}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Swap
            </Button>
          </div>
          {explanation && (
            <div className="text-xs text-muted-foreground p-2 bg-secondary rounded-md border">
              <strong>Tip:</strong> {explanation}
            </div>
          )}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between flex-shrink-0">
          <div className="flex gap-2 justify-between">
            <Button
              onClick={handleAddToDeck}
              disabled={isAddToDeckDisabled}
              variant="secondary"
            >
              {isAddingToDeck && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isAddedToDeck && <Check className="mr-2 h-4 w-4" />}
              {isAddedToDeck ? "Added!" : "Add to Deck"}
            </Button>
            {onApplyTranslation && (
              <Button
                onClick={handleApplyToJournal}
                disabled={!translatedText}
                variant="outline"
              >
                Apply to Journal
              </Button>
            )}
          </div>
          <Button
            onClick={handleTranslate}
            disabled={!sourceText || translateMutation.isPending}
          >
            {translateMutation.isPending && (
              <Spinner size="sm" className="mr-2" />
            )}
            Translate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}