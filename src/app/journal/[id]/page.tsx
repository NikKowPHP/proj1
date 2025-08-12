'use client'
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { FeedbackCard } from "@/components/FeedbackCard";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useJournalEntry,
  useRetryJournalAnalysis,
  useAnalyzeJournal,
  useStudyDeck,
  useTutorChat,
  useUserProfile,
  useJournalTutorChat,
} from "@/lib/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/ui/Spinner";
import { GuidedPopover } from "@/components/ui/GuidedPopover";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { AnalysisSummary } from "@/components/AnalysisSummary";
import { StrengthsCard } from "@/components/StrengthsCard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { JournalAnalysisResult, TutorChatMessage } from "@/lib/types";
import { Mistake } from "@prisma/client";
import { logger } from "@/lib/logger";
import Image from "next/image";
import Link from "next/link";
import { TutorChatDialog } from "@/components/TutorChatDialog";
import { useLanguageStore } from "@/lib/stores/language.store";
import { MessageSquareQuote } from "lucide-react";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";

export default function JournalAnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const { step, setStep } = useOnboardingStore();
  const analysisInitiated = useRef(false);
  const analytics = useAnalytics();
  const [isAnalysisPopoverDismissed, setAnalysisPopoverDismissed] = useState(false);
  const router = useRouter();

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Connecting to AI analysis engine...",
    "Reviewing your grammar and vocabulary...",
    "Finalizing feedback and suggestions...",
  ];

  // State for Tutor Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeMistake, setActiveMistake] = useState<Mistake | null>(null);
  const [chatHistory, setChatHistory] = useState<TutorChatMessage[]>([]);

  // State for Journal Tutor Chat
  const [isJournalTutorOpen, setIsJournalTutorOpen] = useState(false);
  const [journalTutorHistory, setJournalTutorHistory] = useState<TutorChatMessage[]>([]);
  const [isTutorPopoverNew, markTutorPopoverAsSeen] = useFeatureFlag("feature_journal_tutor_v1");

  const { data: userProfile } = useUserProfile();
  const { activeTargetLanguage } = useLanguageStore();
  const tutorChatMutation = useTutorChat();
  const journalTutorChatMutation = useJournalTutorChat();

  const completeOnboarding = () => {
    setStep("COMPLETED");
  };

  const isTourActive = step === "VIEW_ANALYSIS";

  const { data: journal, isLoading, error } = useJournalEntry(id);
  const { data: studyDeck, isLoading: isStudyDeckLoading } = useStudyDeck({
    includeAll: true,
  });
  const retryAnalysisMutation = useRetryJournalAnalysis();
  const analyzeJournalMutation = useAnalyzeJournal();

  useEffect(() => {
    if (
      journal &&
      !journal.analysis &&
      !analyzeJournalMutation.isPending &&
      !analysisInitiated.current
    ) {
      analysisInitiated.current = true;
      analyzeJournalMutation.mutate(id);
    }
  }, [journal, analyzeJournalMutation, id]);

  useEffect(() => {
    if (journal?.analysis) {
      analytics.capture("Analysis Viewed", { journalId: journal.id });
    }
  }, [journal?.analysis, journal?.id, analytics]);

  const isMutationRunning =
    analyzeJournalMutation.isPending || retryAnalysisMutation.isPending;
  const didMutationFailed =
    (analyzeJournalMutation.isError || retryAnalysisMutation.isError) &&
    !isMutationRunning;

  const isAnalysisPending = journal && !journal.analysis && !didMutationFailed;

  useEffect(() => {
    if (isAnalysisPending) {
      setLoadingMessageIndex(0); // Reset on new analysis start
      const timers: NodeJS.Timeout[] = [];

      timers.push(setTimeout(() => setLoadingMessageIndex(1), 10000)); // After 10s
      timers.push(setTimeout(() => setLoadingMessageIndex(2), 20000)); // After 20s

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [isAnalysisPending]);

  const isPageLoading = isLoading || isStudyDeckLoading;

  const analysisData: JournalAnalysisResult | null = useMemo(() => {
    if (!journal?.analysis?.rawAiResponse) return null;
    try {
      const rawResponse = journal.analysis.rawAiResponse;
      if (!rawResponse) {
        return null;
      }
      // Explicitly construct the object to be more robust.
      const result: JournalAnalysisResult = {
        grammarScore: journal.analysis.grammarScore,
        phrasingScore: journal.analysis.phrasingScore,
        vocabularyScore: journal.analysis.vocabScore,
        overallSummary: rawResponse.overallSummary,
        feedback: rawResponse.feedback,
        strengths: rawResponse.strengths || [],
        mistakes: rawResponse.mistakes || [],
        highlights: rawResponse.highlights || [],
      };
      return result;
    } catch (e) {
      logger.error("Failed to process raw AI response:", {
        error: e,
        rawResponse: journal.analysis.rawAiResponse,
      });
      return null;
    }
  }, [journal?.analysis]);

  const groupedMistakes = useMemo(() => {
    if (!journal?.analysis?.mistakes) return {};
    return journal.analysis.mistakes.reduce(
      (acc: Record<string, Mistake[]>, mistake: Mistake) => {
        (acc[mistake.type] = acc[mistake.type] || []).push(mistake);
        return acc;
      },
      {},
    );
  }, [journal?.analysis?.mistakes]);

  const handleAskTutor = (mistake: Mistake) => {
    setActiveMistake(mistake);
    setChatHistory([
      {
        role: "assistant",
        content: `Hi there! I see you're looking at this correction. What would you like to know more about? You can ask for more examples, why the correction is better, or anything else about this specific point.`,
      },
    ]);
    setIsChatOpen(true);
    analytics.capture("TutorChat_Opened", { mistakeId: mistake.id });
  };

  const handleSendChatMessage = (userQuestion: string) => {
    if (!activeMistake || !activeTargetLanguage || !userProfile?.nativeLanguage) return;

    const currentHistory: TutorChatMessage[] = [
      ...chatHistory,
      { role: "user", content: userQuestion },
    ];
    setChatHistory(currentHistory);

    const payload = {
      mistakeId: activeMistake.id,
      mistakeContext: {
        original: activeMistake.originalText,
        corrected: activeMistake.correctedText,
        explanation: activeMistake.explanation,
      },
      chatHistory: currentHistory,
      userQuestion: userQuestion,
      targetLanguage: activeTargetLanguage,
      nativeLanguage: userProfile.nativeLanguage,
    };

    analytics.capture("TutorChat_Message_Sent", {
      mistakeId: activeMistake.id,
      questionLength: userQuestion.length,
    });

    tutorChatMutation.mutate(payload, {
      onSuccess: (data) => {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      },
    });
  };

  const handleAskAboutJournal = () => {
    setIsJournalTutorOpen(true);
    analytics.capture("JournalTutor_Opened", { journalId: id });
  };

  const handleSendJournalTutorMessage = (message: string) => {
    const currentHistory: TutorChatMessage[] = [
      ...journalTutorHistory,
      { role: "user", content: message },
    ];
    setJournalTutorHistory(currentHistory);
    analytics.capture("JournalTutor_Message_Sent", {
      journalId: id,
      messageLength: message.length,
      chatHistoryLength: currentHistory.length,
    });

    journalTutorChatMutation.mutate(
      { journalId: id, chatHistory: currentHistory },
      {
        onSuccess: (data) => {
          setJournalTutorHistory((prev) => [
            ...prev,
            { role: "assistant", content: data.response },
          ]);
        },
      },
    );
  };


  if (isPageLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!journal) return <div>Journal entry not found.</div>;

  const analysisFailed = !journal.analysis && didMutationFailed;

  const analysisDisplayComponent = (
    <AnalysisDisplay
      content={journal.content}
      highlights={analysisData?.highlights || []}
      mistakes={journal.analysis?.mistakes || []}
    />
  );

  const addedMistakeIds = new Set(
    studyDeck?.map((item: any) => item.mistakeId).filter(Boolean),
  );

  return (
    <div className="container mx-auto p-4 space-y-8">
      {activeMistake && (
         <TutorChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          contextTitle="Ask about this correction"
          contextDescription={
            <div className="p-2 bg-secondary rounded-md text-sm mt-2 text-left">
              <p className="line-through text-muted-foreground">
                {activeMistake.originalText}
              </p>
              <p className="text-green-600 dark:text-green-400">
                {activeMistake.correctedText}
              </p>
            </div>
          }
          chatHistory={chatHistory}
          onSendMessage={handleSendChatMessage}
          isLoading={tutorChatMutation.isPending}
        />
      )}

      {journal && (
        <TutorChatDialog
          isOpen={isJournalTutorOpen}
          onClose={() => setIsJournalTutorOpen(false)}
          contextTitle="Chat about your journal entry"
          contextDescription={
            <p className="italic text-muted-foreground line-clamp-2">
              "{journal.content}"
            </p>
          }
          chatHistory={journalTutorHistory}
          onSendMessage={handleSendJournalTutorMessage}
          isLoading={journalTutorChatMutation.isPending}
        />
      )}

      <h1 className="text-2xl font-bold">Journal Entry Analysis</h1>

      {journal.topic.imageUrl && (
        <Card className="w-full lg:w-2/3 mx-auto">
          <CardHeader>
            <CardTitle>Image Context</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <Image
                src={journal.topic.imageUrl}
                alt={journal.topic.title}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Image context for your entry: "{journal.topic.title}"
            </p>
          </CardContent>
        </Card>
      )}

      {isAnalysisPending ? (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>Analysis in Progress...</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">
              {loadingMessages[loadingMessageIndex]}
            </p>
          </CardContent>
        </Card>
      ) : analysisFailed ? (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>Analysis Failed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
              We couldn't analyze this entry. Please try again.
            </p>
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => retryAnalysisMutation.mutate(id)}
              disabled={retryAnalysisMutation.isPending}
            >
              {retryAnalysisMutation.isPending
                ? "Retrying..."
                : "Retry Analysis"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {analysisData && (
            <>
              <AnalysisSummary
                grammarScore={analysisData.grammarScore}
                phrasingScore={analysisData.phrasingScore}
                vocabularyScore={analysisData.vocabularyScore}
                overallSummary={analysisData.overallSummary}
              />
               <div className="w-full lg:w-2/3 mx-auto">
                <GuidedPopover
                  isOpen={isTutorPopoverNew}
                  onDismiss={markTutorPopoverAsSeen}
                  title="New! Journal-wide Tutor"
                  description="Ask general questions about your entire entry. The AI has the full context of this analysis and your past performance."
                >
                  <Button variant="outline" className="w-full" onClick={handleAskAboutJournal}>
                    <MessageSquareQuote className="mr-2 h-4 w-4" />Ask About This Entry
                  </Button>
                </GuidedPopover>
              </div>
              <div className="w-full lg:w-2/3 mx-auto">
                {isTourActive ? (
                  <GuidedPopover
                    isOpen={!isAnalysisPopoverDismissed}
                    onDismiss={() => {
                      setAnalysisPopoverDismissed(true);
                      analytics.capture("Onboarding Popover Dismissed", { step: "VIEW_ANALYSIS", popover: "Review Your Feedback" });
                    }}
                    title="Review Your Feedback"
                    description="We've highlighted areas for improvement. The colors show the type of feedback."
                  >
                    {analysisDisplayComponent}
                  </GuidedPopover>
                ) : (
                  analysisDisplayComponent
                )}
              </div>
              {analysisData.strengths && analysisData.strengths.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">What You Did Well</h2>
                  <div className="w-full lg:w-2/3 mx-auto space-y-4">
                    {analysisData.strengths.map((strength, index) => (
                      <StrengthsCard
                        key={index}
                        text={strength.text}
                        explanation={strength.explanation}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Areas for Improvement</h2>
                {Object.keys(groupedMistakes).length > 0 ? (
                  <Tabs
                    defaultValue={Object.keys(groupedMistakes)[0]}
                    className="w-full lg:w-2/3 mx-auto"
                  >
                    <TabsList>
                      {Object.entries(groupedMistakes).map(
                        ([type, mistakes]) => (
                          <TabsTrigger key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} (
                            {mistakes.length})
                          </TabsTrigger>
                        ),
                      )}
                    </TabsList>
                    {Object.entries(groupedMistakes).map(
                      ([type, mistakes], catIndex) => (
                        <TabsContent key={type} value={type}>
                          <div className="space-y-4">
                            {mistakes.map((feedback, index: number) => {
                              const isAlreadyInDeck = addedMistakeIds.has(
                                feedback.id,
                              );
                              return (
                                <div
                                  key={feedback.id}
                                  className="w-full mx-auto"
                                >
                                  <FeedbackCard
                                    original={feedback.originalText}
                                    suggestion={feedback.correctedText}
                                    explanation={feedback.explanation}
                                    mistakeId={feedback.id}
                                    isAlreadyInDeck={isAlreadyInDeck}
                                    onOnboardingAddToDeck={() => setStep("CREATE_DECK")}
                                    isOnboarding={isTourActive && catIndex === 0 && index === 0}
                                    onAskTutor={() => handleAskTutor(feedback)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                      ),
                    )}
                  </Tabs>
                ) : (
                  <div className="w-full lg:w-2/3 mx-auto">
                    <Card className="p-6 text-center">
                      <CardHeader>
                        <CardTitle>Great Job!</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          Our AI didn't find any specific mistakes to correct in
                          this entry. You're on the right track!
                        </p>
                        {isTourActive && (
                          <Button onClick={completeOnboarding} className="mt-4">
                            Continue Onboarding
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              <div className="w-full lg:w-2/3 mx-auto flex justify-between items-center pt-8 border-t">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
                <Button asChild>
                  <Link href="/study">Go to Study Deck</Link>
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}