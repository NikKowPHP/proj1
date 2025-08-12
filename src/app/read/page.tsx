"use client";

import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { JournalEditor } from "@/components/JournalEditor";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReadingMaterial,
  useUserProfile,
  useGenerateReadingTask,
} from "@/lib/hooks/data";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useLanguageStore } from "@/lib/stores/language.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelection } from "@/lib/hooks/ui/useSelection";
import { TranslationTooltip } from "@/components/ui/TranslationTooltip";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import type { StructuredWritingTasks, WritingTask } from "@/lib/types";
import { GuidedPopover } from "@/components/ui/GuidedPopover";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth.store";
import { LanguageSetupDialog } from "@/components/LanguageSetupDialog";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

function ReadingPageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

const JournalSectionSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-40 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ReadPage() {
  const { data, isLoading, error, refetch } = useReadingMaterial();
  const { activeTargetLanguage } = useLanguageStore();
  const analytics = useAnalytics();
  const { step, setStep } = useOnboardingStore();
  const isTourActive = step === "READ_WRITE_INTRO";
  const articleRef = useRef<HTMLElement>(null);
  const selection = useSelection(articleRef);
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  const [writingTasks, setWritingTasks] =
    useState<StructuredWritingTasks | null>(null);
  const [isLanguageSetupOpen, setLanguageSetupOpen] = useState(false);
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  const [isPassageNew, markPassageAsSeen] = useFeatureFlag(
    "read_passage_popover",
  );
  const [isTaskNew, markTaskAsSeen] = useFeatureFlag("read_task_popover");


  const {
    mutate: generateTasks,
    isPending: isGeneratingTasks,
    isError: generationFailed,
  } = useGenerateReadingTask();

  useEffect(() => {
    if (userProfile && !isProfileLoading) {
      if (
        !userProfile.nativeLanguage || !userProfile.defaultTargetLanguage
      ) {
        setLanguageSetupOpen(true);
      }
    }
  }, [userProfile, isProfileLoading]);

  const handleGenerateTasks = useCallback(() => {
    if (data?.id && data.content && data.level && activeTargetLanguage) {
      generateTasks(
        {
          content: data.content,
          targetLanguage: activeTargetLanguage,
          level: data.level,
          materialId: data.id,
        },
        {
          onSuccess: (newTasks) => {
            setWritingTasks(newTasks);
          },
        },
      );
    }
  }, [data?.id, data?.content, data?.level, activeTargetLanguage, generateTasks]);

  useEffect(() => {
    if (data?.id) {
      setWritingTasks(null); // Reset on new material
      handleGenerateTasks();
    }
    // Cleanup function to reset on unmount.
    return () => {
      setWritingTasks(null);
    };
  }, [data?.id, handleGenerateTasks]);

  useEffect(() => {
    if (data) {
      analytics.capture("Read & Write Started", {
        materialId: data.id,
        language: activeTargetLanguage,
      });
    }
  }, [data, activeTargetLanguage, analytics]);

  const handleTranslationSuccess = useCallback(
    (details: {
      selectedText: string;
      translation: string;
      explanation: string;
    }) => {
      analytics.capture("Text Translated (Tooltip)", {
        source: "read_page",
        selectedText: details.selectedText,
        language: activeTargetLanguage,
      });
    },
    [analytics, activeTargetLanguage],
  );

  const getLanguageName = (value: string | null | undefined): string => {
    if (!value) return "";
    const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
    return lang ? lang.name : value;
  };

  const selectedTask: WritingTask | undefined = useMemo(() => {
    if (!writingTasks) return undefined;
    return writingTasks.summary; // Always present the summary task
  }, [writingTasks]);

  const journalEditorComponent = (
    <JournalEditor
      // Use material ID for key to reset when material changes
      key={data?.id || 'editor'}
      topicTitle={selectedTask?.title || "Loading task..."}
      topicDescription={selectedTask?.prompt}
      mode={"summary"}
      isOnboarding={isTourActive}
      onOnboardingSubmit={() => setStep("DRILL_INTRO")}
    />
  );

  if (isLoading || isProfileLoading) {
    return <ReadingPageSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-destructive">Error: {(error as Error).message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const needsProfileSetup =
    userProfile &&
    (!userProfile.nativeLanguage || !userProfile.defaultTargetLanguage);


  if (!data) {
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Read & Write</h1>
          <LanguageSwitcher />
        </div>
        <p className="text-muted-foreground text-center py-10">
          No reading materials available for your current language and level.
        </p>
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
      {selection.isVisible &&
        userProfile?.nativeLanguage &&
        activeTargetLanguage && (
          <TranslationTooltip
            selectedText={selection.selectedText}
            contextText={selection.contextText}
            sourceLang={getLanguageName(activeTargetLanguage)}
            targetLang={getLanguageName(userProfile.nativeLanguage)}
            position={selection.position}
            onClose={selection.close}
            onTranslationSuccess={handleTranslationSuccess}
          />
        )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Read & Write</h1>
        <LanguageSwitcher />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <GuidedPopover
          isOpen={isPassageNew && !isTourActive}
          onDismiss={markPassageAsSeen}
          title="Interactive Reading"
          description="Select any word or phrase in the text to get an instant translation and explanation."
        >
          <Card>
            <CardContent className="p-6">
              <article
                ref={articleRef}
                className="prose dark:prose-invert max-w-none no-touch-callout"
              >
                <h2 className="text-xl font-bold mb-4">{data.title}</h2>
                <p className="underline decoration-dashed decoration-1 decoration-[color:var(--interactive-underline)] underline-offset-4 cursor-help">
                  {data.content}
                </p>
                {data.source && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Source: {data.source}
                  </p>
                )}
              </article>
            </CardContent>
          </Card>
        </GuidedPopover>

        <div>
          <GuidedPopover
            isOpen={isTaskNew && !isTourActive}
            onDismiss={markTaskAsSeen}
            title="Test Your Comprehension"
            description="After reading, complete the writing task. We'll give you feedback on your summary."
          >
            {isGeneratingTasks && <JournalSectionSkeleton />}
            {generationFailed && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive mb-4">
                    Could not generate writing exercises.
                  </p>
                  <Button onClick={handleGenerateTasks}>Try Again</Button>
                </CardContent>
              </Card>
            )}
            {writingTasks && !isGeneratingTasks && !generationFailed && (
              <div className="mt-4">
                {isTourActive ? (
                  <GuidedPopover
                    isOpen={true}
                    onDismiss={() => {}}
                    title={selectedTask?.title || "Your Writing Task"}
                    description="Now it's your turn. Practice what you've learned by completing this writing task."
                  >
                    {journalEditorComponent}
                  </GuidedPopover>
                ) : (
                  journalEditorComponent
                )}
              </div>
            )}
          </GuidedPopover>
        </div>
      </div>
    </div>
  );
}