"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/Spinner";
import { X, Check, Plus, Lightbulb } from "lucide-react";
import {
  useContextualTranslate,
  useCreateSrsFromTranslation,
  useStudyDeck,
} from "@/lib/hooks/data";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

interface TranslationTooltipProps {
  selectedText: string;
  contextText: string;
  sourceLang: string; // This is the user's TARGET language (the language of the text being selected)
  targetLang: string; // This is the user's NATIVE language (the language to translate to)
  position: { x: number; y: number };
  onClose: () => void;
  onTranslationSuccess: (details: {
    selectedText: string;
    translation: string;
    explanation: string;
  }) => void;
}

export function TranslationTooltip({
  selectedText,
  contextText,
  sourceLang,
  targetLang,
  position,
  onClose,
  onTranslationSuccess,
}: TranslationTooltipProps) {
  const {
    mutate: translate,
    data: translationData,
    isPending: isTranslating,
    isError: isTranslationError,
  } = useContextualTranslate();
  const addToDeckMutation = useCreateSrsFromTranslation();
  const { data: studyDeck } = useStudyDeck();
  const hasTrackedSuccess = useRef(false);

  useEffect(() => {
    if (selectedText && contextText) {
      translate({
        selectedText,
        context: contextText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });
    }
  }, [selectedText, contextText, sourceLang, targetLang, translate]);

  useEffect(() => {
    if (translationData && !hasTrackedSuccess.current) {
      onTranslationSuccess({
        selectedText,
        translation: translationData.translation,
        explanation: translationData.explanation,
      });
      hasTrackedSuccess.current = true;
    }
  }, [translationData, onTranslationSuccess, selectedText]);

  const deckSet = new Set(studyDeck?.map((item: any) => item.frontContent));
  const isAlreadyInDeck = deckSet.has(selectedText);

  const handleAddToDeck = () => {
    if (translationData?.translation) {
      const sourceLangCode =
        SUPPORTED_LANGUAGES.find((l) => l.name === sourceLang)?.value ||
        sourceLang;
      addToDeckMutation.mutate({
        frontContent: selectedText,
        backContent: translationData.translation,
        targetLanguage: sourceLangCode,
        explanation: translationData.explanation,
      });
    }
  };

  const isAddToDeckDisabled =
    !translationData ||
    addToDeckMutation.isPending ||
    addToDeckMutation.isSuccess ||
    isAlreadyInDeck;
  const showAddedState = addToDeckMutation.isSuccess || isAlreadyInDeck;

  return (
    <div
      role="tooltip"
      className="fixed z-50 transform -translate-x-1/2"
      style={{ top: position.y, left: position.x }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Card className="p-3 w-64 shadow-2xl bg-popover/90 backdrop-blur-lg">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <CardContent className="p-0 space-y-2">
          <p className="text-sm font-semibold pr-6">{selectedText}</p>
          <div className="border-t -mx-3 my-2" />
          {isTranslating && <Spinner size="sm" />}
          {isTranslationError && (
            <p className="text-xs text-destructive">Translation failed.</p>
          )}
          {translationData && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <p className="text-sm text-popover-foreground">
                {translationData.translation}
              </p>
              {translationData.explanation && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-secondary rounded-md border">
                  <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{translationData.explanation}</span>
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="w-full h-8"
                onClick={handleAddToDeck}
                disabled={isAddToDeckDisabled}
              >
                {addToDeckMutation.isPending ? (
                  <Spinner size="sm" />
                ) : showAddedState ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Added to Deck
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Add to Deck
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}