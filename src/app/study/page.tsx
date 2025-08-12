'use client'
import { StudySession } from "@/components/StudySession";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudyDeck, useUserProfile, useDrillSession } from "@/lib/hooks/data";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguageStore } from "@/lib/stores/language.store";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { GuidedPopover } from "@/components/ui/GuidedPopover";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Sprout, CheckCircle, PenSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DrillSession } from "@/components/DrillSession";
import { useState, useEffect } from "react";
import Spinner from "@/components/ui/Spinner";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Card } from "@/components/ui/card";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

export default function StudyPage() {
  const { step, setStep } = useOnboardingStore();
  const isTourActive = step === "STUDY_INTRO";
  const isDrillIntroActive = step === "DRILL_INTRO";
  const [isStudyIntroPopoverNew, markStudyIntroPopoverAsSeen] = useFeatureFlag("study_intro_popover");
  const [sessionKey, setSessionKey] = useState(Date.now());


  const { activeTargetLanguage } = useLanguageStore();
  const analytics = useAnalytics();

  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const {
    data: studyDeck,
    isLoading: isDeckLoading,
    error,
  } = useStudyDeck();

  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);
  const [drillKey, setDrillKey] = useState(0); // Key to force refetch

  const {
    data: drillCards,
    isLoading: isDrillLoading,
    refetch: refetchDrillCards,
  } = useDrillSession(isDrillModalOpen, drillKey);

  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (drillCards && drillCards.length > 0) {
      analytics.capture("Drill Session Started", {
        cardCount: drillCards.length,
        language: activeTargetLanguage,
      });
    }
  }, [drillCards, activeTargetLanguage, analytics]);

  useEffect(() => {
    if (isDrillIntroActive) {
      setIsDrillModalOpen(true);
    }
  }, [isDrillIntroActive]);
  
  // When language changes, close the drill modal if it's open
  useEffect(() => {
    if (isDrillModalOpen) {
      setIsDrillModalOpen(false);
    }
  }, [activeTargetLanguage]);

  const handleFirstReview = () => {
    if (isTourActive) {
      setStep("READ_WRITE_INTRO");
    }
  };

  const handleNewSessionRequest = () => {
    queryClient.invalidateQueries({
      queryKey: [
        "studyDeck",
        authUser?.id,
        activeTargetLanguage,
        { includeAll: false },
      ],
    });
    setSessionKey(Date.now());
  };

  const startDrill = () => {
    // Incrementing the key will trigger a refetch in useDrillSession
    setDrillKey(prev => prev + 1);
    setIsDrillModalOpen(true);
  };

  const isLoading = isProfileLoading || isDeckLoading;

  if (isLoading)
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (error)
    return <div>Error loading study deck: {(error as Error).message}</div>;

  const studySession = (
    <StudySession
      key={sessionKey}
      cards={studyDeck || []}
      nativeLanguage={userProfile?.nativeLanguage}
      targetLanguage={activeTargetLanguage}
      isTourActive={isTourActive}
      onOnboardingReview={handleFirstReview}
      onNewSessionRequest={handleNewSessionRequest}
    />
  );

  const getLanguageName = (value: string) => {
    return SUPPORTED_LANGUAGES.find((l) => l.value === value)?.name || value;
  };

  const drillSessionComponent = (
     <DrillSession
        cards={drillCards || []}
        nativeLanguage={userProfile?.nativeLanguage}
        targetLanguage={activeTargetLanguage}
        onEndDrill={() => setIsDrillModalOpen(false)}
        onNewDrill={startDrill}
      />
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Study Deck (SRS)</h1>
        <LanguageSwitcher />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/study/mistakes">
            <BookOpen className="h-4 w-4 mr-2" />
            My Mistake Diary
          </Link>
        </Button>
        <Button onClick={startDrill} variant="secondary" disabled={isDrillLoading && isDrillModalOpen}>
          {isDrillLoading && isDrillModalOpen && <Spinner size="sm" className="mr-2" />}
          <Sprout className="h-4 w-4 mr-2" />
          Start Quick Drill
        </Button>
      </div>


      {!activeTargetLanguage ? (
        <p>Please select a language to start studying.</p>
      ) : isTourActive && studyDeck && studyDeck.length > 0 ? (
        <GuidedPopover
          isOpen={isTourActive && isStudyIntroPopoverNew}
          onDismiss={() => {
            markStudyIntroPopoverAsSeen();
            analytics.capture("Onboarding Popover Dismissed", { step: "STUDY_INTRO", popover: "Practice Makes Perfect" });
          }}
          placement="bottom"
          title="Practice Makes Perfect"
          description="Flip the card, then rate how well you remembered it to update your study schedule."
        >
          {studySession}
        </GuidedPopover>
      ) : studyDeck && studyDeck.length > 0 ? (
        studySession
      ) : (
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex-shrink-0 items-center justify-center hidden sm:flex">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-title-2">All Caught Up!</h2>
                <p className="text-muted-foreground mt-1">
                  You have no cards due for review in {getLanguageName(activeTargetLanguage)}.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/journal">
                  <PenSquare className="h-4 w-4 mr-2" />
                  Write a New Entry
                </Link>
              </Button>
              <Button variant="secondary" onClick={startDrill} className="w-full sm:w-auto">
                <Sprout className="h-4 w-4 mr-2" />
                Start a Quick Drill
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={isDrillModalOpen} onOpenChange={setIsDrillModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Drill Session</DialogTitle>
             {isDrillIntroActive && (
              <DialogDescription>
                This is a quick, no-stakes practice round. It won't affect your SRS schedule.
              </DialogDescription>
            )}
          </DialogHeader>
          {isDrillLoading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner size="lg" />
            </div>
          ) : isDrillIntroActive ? (
             <GuidedPopover
              isOpen={true}
              onDismiss={() => setStep("COMPLETED")}
              title="Drill Your Knowledge"
              description="Review previously learned concepts without the pressure of SRS. Click the X when you're done."
             >
               {drillSessionComponent}
             </GuidedPopover>
          ) : (
            drillSessionComponent
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}