"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/Spinner";
import {
  useUserProfile,
  useStudyDeck,
  useTranslateAndBreakdown,
  useTranslateText,
} from "@/lib/hooks/data";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { LanguageSelectorPanel } from "@/components/translator/LanguageSelectorPanel";
import { TranslationInput } from "@/components/translator/TranslationInput";
import { TranslationOutput } from "@/components/translator/TranslationOutput";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth.store";
import { LanguageSetupDialog } from "@/components/LanguageSetupDialog";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import { GuidedPopover } from "@/components/ui/GuidedPopover";

interface Segment {
  source: string;
  translation: string;
  explanation: string;
}

export default function TranslatorPage() {
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { data: studyDeck } = useStudyDeck({ includeAll: true });
  const translateAndBreakdownMutation = useTranslateAndBreakdown();
  const translateTextMutation = useTranslateText();
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  const [sourceLang, setSourceLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [fullTranslation, setFullTranslation] = useState("");
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [isLanguageSetupOpen, setLanguageSetupOpen] = useState(false);
  const [isNewFeature, markAsSeen] = useFeatureFlag("translator_breakdown_popover");


  const allUserLanguages = useMemo(() => {
    if (!userProfile) return [];
    const languages = new Set<string>();
    if (userProfile.nativeLanguage) {
      languages.add(userProfile.nativeLanguage);
    }
    userProfile.languageProfiles?.forEach((p: any) =>
      languages.add(p.language),
    );
    return Array.from(languages);
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && !isProfileLoading) {
      if (
        !userProfile.nativeLanguage || !userProfile.defaultTargetLanguage
      ) {
        setLanguageSetupOpen(true);
      }
    }
  }, [userProfile, isProfileLoading]);

  useEffect(() => {
    if (userProfile && !sourceLang && !targetLang) {
      setSourceLang(userProfile.nativeLanguage);
      setTargetLang(userProfile.defaultTargetLanguage);
    }
  }, [userProfile, sourceLang, targetLang]);

  useEffect(() => {
    setFullTranslation("");
    setSegments(null);
  }, [sourceText]);

  const getLanguageName = (value: string | null | undefined): string => {
    if (!value) return "";
    const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
    return lang ? lang.name : value;
  };

  const handleTranslate = () => {
    if (sourceText.trim() && sourceLang && targetLang) {
      setFullTranslation("");
      setSegments(null);

      const payload = {
        text: sourceText,
        sourceLanguage: getLanguageName(sourceLang),
        targetLanguage: getLanguageName(targetLang),
      };

      // Fast translation for immediate feedback
      translateTextMutation.mutate(payload, {
        onSuccess: (data) => {
          setFullTranslation(data.translatedText);
          analytics.capture("Text Translated", {
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            characterCount: sourceText.length,
          });
        },
      });

      // Slower, more detailed breakdown
      translateAndBreakdownMutation.mutate(payload, {
        onSuccess: (breakdownData) => {
          setSegments(breakdownData.segments);
        },
      });
    }
  };

  const handleSwapLanguages = () => {
    translateAndBreakdownMutation.reset();
    translateTextMutation.reset();

    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(fullTranslation);
    setFullTranslation("");
    setSegments(null);
  };

  const deckSet = new Set<string>(
    studyDeck?.map((item: { frontContent: string }) => item.frontContent) ?? [],
  );

  const isTranslating = translateTextMutation.isPending;
  const isBreakingDown = translateAndBreakdownMutation.isPending;
  const error =
    translateTextMutation.error || translateAndBreakdownMutation.error;

  if (isProfileLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <LanguageSetupDialog
        isOpen={isLanguageSetupOpen}
        onSuccess={() => {
          setLanguageSetupOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["userProfile", authUser?.id],
          });
        }}
      />
      <h1 className="text-2xl font-bold">Translator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enter Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LanguageSelectorPanel
              sourceLang={sourceLang}
              targetLang={targetLang}
              allUserLanguages={allUserLanguages}
              onSourceChange={setSourceLang}
              onTargetChange={setTargetLang}
              onSwap={handleSwapLanguages}
            />
            <GuidedPopover
              isOpen={isNewFeature}
              onDismiss={markAsSeen}
              title="Sentence Breakdowns"
              description="After translating, you'll see a breakdown of each sentence. You can add any of them to your study deck for later practice."
            >
              <TranslationInput
                sourceText={sourceText}
                onTextChange={setSourceText}
                isLoading={isTranslating}
              />
            </GuidedPopover>
            <div className="flex justify-end items-center">
              <Button onClick={handleTranslate} disabled={isTranslating}>
                {isTranslating && <Spinner size="sm" className="mr-2" />}
                Translate
              </Button>
            </div>
            {error && (
              <p className="text-destructive text-sm">
                {(error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>
        <TranslationOutput
          sourceLang={sourceLang}
          targetLang={targetLang}
          translatedText={fullTranslation}
          isBreakingDown={isBreakingDown}
          segments={segments}
          studyDeckSet={deckSet}
        />
      </div>
    </div>
  );
}