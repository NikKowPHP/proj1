"use client";
import React, { useMemo, useRef, useEffect, useState } from "react";
import { JournalEditor } from "@/components/JournalEditor";
import { JournalHistoryList } from "@/components/JournalHistoryList";
import {
  useGenerateTopics,
  useJournalHistory,
  useUserProfile,
} from "@/lib/hooks/data";
import { useSearchParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SuggestedTopics } from "@/components/SuggestedTopics";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSuggestedTopics } from "@/lib/hooks/data/useSuggestedTopics";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { GuidedPopover } from "@/components/ui/GuidedPopover";
import { onboardingPrompts } from "@/lib/translations";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth.store";
import { LanguageSetupDialog } from "@/components/LanguageSetupDialog";

function JournalPageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export default function JournalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicFromQuery = searchParams.get("topic");
  const editorRef = useRef<HTMLDivElement>(null);

  const [isLanguageSetupOpen, setLanguageSetupOpen] = useState(false);
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  const { step, setStep, setOnboardingJournalId } = useOnboardingStore();
  const { activeTargetLanguage } = useLanguageStore();
  const isTourActive = step === "FIRST_JOURNAL";

  const generateTopicsMutation = useGenerateTopics();
  const {
    data: suggestedTopics,
    isLoading: isTopicsLoading,
    isFetching,
  } = useSuggestedTopics();

  const handleGenerateTopics = () => {
    generateTopicsMutation.mutate();
  };
  const isLoadingTopics =
    isTopicsLoading || isFetching || generateTopicsMutation.isPending;

  const {
    data: journals,
    isLoading: isJournalsLoading,
    error: journalsError,
  } = useJournalHistory();

  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

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
    if (topicFromQuery && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [topicFromQuery]);

  const isLoading = isJournalsLoading || isProfileLoading;
  const error = journalsError;

  const dynamicOnboardingPrompt = useMemo(() => {
    if (!isTourActive) return "";

    const langName =
      SUPPORTED_LANGUAGES.find((l) => l.value === activeTargetLanguage)?.name ||
      activeTargetLanguage;

    const promptTemplate =
      onboardingPrompts.introduceYourselfV2[
        activeTargetLanguage as keyof typeof onboardingPrompts.introduceYourselfV2
      ] || onboardingPrompts.introduceYourselfV2.english;

    return promptTemplate.replace("{languageName}", langName || "");
  }, [isTourActive, activeTargetLanguage]);

  if (isLoading) return <JournalPageSkeleton />;
  if (error)
    return <div>Error loading journals: {(error as Error).message}</div>;

  const mappedJournals =
    journals?.map((j: any) => ({
      id: j.id,
      title: j.topic.title,
      snippet: j.content.substring(0, 100) + "...",
      date: new Date(j.createdAt).toLocaleDateString(),
      isPending: j.isPending,
      isMastered: j.topic.isMastered,
      topic: j.topic,
    })) || [];

  const editorComponent = (
    <JournalEditor
      topicTitle={
        isTourActive ? "Introduce yourself." : topicFromQuery || undefined
      }
      topicDescription={isTourActive ? dynamicOnboardingPrompt : undefined}
      isOnboarding={isTourActive}
      onOnboardingSubmit={(id) => {
        setOnboardingJournalId(id);
        setStep("VIEW_ANALYSIS");
        router.replace(`/journal/${id}`);
      }}
    />
  );

  const needsProfileSetup =
    userProfile &&
    (!userProfile.nativeLanguage || !userProfile.defaultTargetLanguage);

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
        <h1 className="text-2xl font-bold">My Journal</h1>
        <LanguageSwitcher />
      </div>
      <div className="space-y-4">
        <Button onClick={handleGenerateTopics} disabled={isLoadingTopics}>
          {isLoadingTopics ? "Generating..." : "Suggest New Topics"}
        </Button>
        <SuggestedTopics
          topics={suggestedTopics?.topics || []}
          isLoading={isLoadingTopics}
        />
        {!isLoadingTopics &&
          (!suggestedTopics ||
            !suggestedTopics.topics ||
            suggestedTopics.topics.length === 0) && (
            <p className="text-muted-foreground text-sm">
              No suggestions yet. Click 'Suggest New Topics' to get some ideas!
            </p>
          )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <JournalHistoryList journals={mappedJournals} />
        <div ref={editorRef} className="relative">
          {isTourActive ? (
            <GuidedPopover
              isOpen={true}
              onDismiss={() => {}}
              title="Your First Entry"
              description="Write your first journal entry here. Don't worry about perfection; just express yourself!"
            >
              {editorComponent}
            </GuidedPopover>
          ) : (
            <>
              <div
                className={
                  needsProfileSetup ? "blur-sm pointer-events-none" : ""
                }
              >
                {editorComponent}
              </div>
              {needsProfileSetup && !isLanguageSetupOpen && (
                <div className="absolute inset-0 bg-transparent z-10 flex flex-col items-center justify-center p-4">
                  <Card className="text-center w-full max-w-sm bg-background/95 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle>Complete Your Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Please complete your profile setup to begin journaling.
                      </p>
                      <Button asChild>
                        <Link href="/settings">Go to Settings</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}