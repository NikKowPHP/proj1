'use client'
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JournalHistoryList } from "@/components/JournalHistoryList";
import { SuggestedTopics } from "@/components/SuggestedTopics";
import {
  useUserProfile,
  useAnalyticsData,
  useGenerateTopics,
  usePracticeAnalytics,
  useDashboardTutorChat,
} from "@/lib/hooks/data";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSummary } from "@/components/DashboardSummary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSuggestedTopics } from "@/lib/hooks/data/useSuggestedTopics";
import { ProficiencyChart } from "@/components/ProficiencyChart";
import { SubskillScores } from "@/components/SubskillScores";
import { PricingTable } from "@/components/PricingTable";
import { SubskillProgressChart } from "@/components/SubskillProgressChart";
import { PredictionInfo } from "@/components/ui/PredictionInfo";
import { PredictionHorizonSelector, type PredictionHorizon } from "@/components/dashboard/PredictionHorizonSelector";
import { ChallengingConceptsCard, type Concept } from "@/components/dashboard/ChallengingConceptsCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PracticeSection } from "@/components/PracticeSection";
import { GoalProgressCard } from "@/components/dashboard/GoalProgressCard";
import { SrsForecastCard } from "@/components/dashboard/SrsForecastCard";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth.store";
import { LanguageSetupDialog } from "@/components/LanguageSetupDialog";
import { MessageSquarePlus } from "lucide-react";
import { TutorChatDialog } from "@/components/TutorChatDialog";
import { useLanguageStore } from "@/lib/stores/language.store";
import type { TutorChatMessage } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";

const MAX_CHAT_HISTORY = 10;

export default function DashboardPage() {
  const [predictionHorizon, setPredictionHorizon] = useState<PredictionHorizon>('3m');
  const [practiceConcept, setPracticeConcept] = useState<Concept | null>(null);
  const [isLanguageSetupOpen, setLanguageSetupOpen] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorHistory, setTutorHistory] = useState<TutorChatMessage[]>([]);
  const [isTutorGreetingLoading, setIsTutorGreetingLoading] = useState(false);
  const [tutorGreetingError, setTutorGreetingError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const { activeTargetLanguage } = useLanguageStore();

  const { data: user, isLoading: isUserLoading } = useUserProfile();
  const { data: analytics, isLoading: isAnalyticsLoading, isFetching: isAnalyticsFetching } = useAnalyticsData(predictionHorizon);
  const { data: practiceAnalytics, isLoading: isPracticeAnalyticsLoading } = usePracticeAnalytics();
  const generateTopicsMutation = useGenerateTopics();
  const { data: suggestedTopics, isLoading: isTopicsLoading, isFetching: isSuggestedTopicsFetching } = useSuggestedTopics();
  const tutorChatMutation = useDashboardTutorChat();

  useEffect(() => {
    if (user && !isUserLoading) {
      if (!user.onboardingCompleted && (!user.nativeLanguage || !user.defaultTargetLanguage)) {
        setLanguageSetupOpen(true);
      }
    }
  }, [user, isUserLoading]);

  useEffect(() => {
    if (isTutorOpen && tutorHistory.length === 0 && activeTargetLanguage) {
      setIsTutorGreetingLoading(true);
      setTutorGreetingError(null);
      tutorChatMutation.mutate(
        { targetLanguage: activeTargetLanguage, chatHistory: [{ role: 'user', content: 'Initial Greeting' }] },
        {
          onSuccess: (data) => {
            setTutorHistory([{ role: 'assistant', content: data.response }]);
          },
          onError: (error) => {
            setTutorGreetingError(error.message || "Failed to connect to the AI coach.");
          },
          onSettled: () => {
            setIsTutorGreetingLoading(false);
          },
        }
      );
    }
  }, [isTutorOpen, tutorHistory.length, activeTargetLanguage, tutorChatMutation]);


  const handleGenerateTopics = () => {
    generateTopicsMutation.mutate();
  };

  const handleSendTutorMessage = (message: string) => {
    if (!activeTargetLanguage) return;

    const currentHistory: TutorChatMessage[] = [...tutorHistory, { role: 'user', content: message }];
    setTutorHistory(currentHistory);

    const truncatedHistory = currentHistory.slice(-MAX_CHAT_HISTORY);

    tutorChatMutation.mutate(
      { targetLanguage: activeTargetLanguage, chatHistory: truncatedHistory },
      {
        onSuccess: (data) => {
          setTutorHistory((prev) => [...prev, { role: 'assistant', content: data.response }]);
        },
      }
    );
  };

  const isLoadingTopics = isTopicsLoading || isSuggestedTopicsFetching || generateTopicsMutation.isPending;
  const isPageLoading = isUserLoading || (!!user && !analytics && isAnalyticsLoading);

  const chartData = useMemo(() => {
    if (!analytics) return { proficiency: [], subskill: [], prediction: [], subskillPrediction: [] };
    return {
      proficiency: analytics.proficiencyOverTime,
      subskill: analytics.subskillProficiencyOverTime,
      prediction: analytics.predictedProficiencyOverTime,
      subskillPrediction: analytics.predictedSubskillProficiencyOverTime,
    };
  }, [analytics]);

  const chartTimeRange = useMemo(() => {
    if (!analytics?.proficiencyOverTime || analytics.proficiencyOverTime.length < 2) return '1y';
    const firstDate = new Date(analytics.proficiencyOverTime[0].date);
    const lastDate = new Date(analytics.proficiencyOverTime[analytics.proficiencyOverTime.length - 1].date);
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 365 ? 'all' : '1y';
  }, [analytics?.proficiencyOverTime]);

  if (isPageLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const hasEntries = analytics && analytics.totalEntries > 0;
  const showPredictions = analytics && analytics.predictedProficiencyOverTime && analytics.predictedProficiencyOverTime.length > 0;


  const mappedJournals =
    analytics?.recentJournals?.map((j: any) => ({
      id: j.id,
      title: j.topic.title,
      snippet: j.content.substring(0, 100) + "...",
      date: new Date(j.createdAt).toLocaleDateString(),
      topic: j.topic,
    })) || [];

  const skillBreakdown = analytics?.subskillScores
    ? Object.entries(analytics.subskillScores).map(([skill, score]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        score: Number(score),
      }))
    : [];

  return (
    <div className="container mx-auto p-4 space-y-8">
      <LanguageSetupDialog isOpen={isLanguageSetupOpen} onSuccess={() => setLanguageSetupOpen(false)} />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <LanguageSwitcher />
      </div>

      {!hasEntries ? (
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>Start Your Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              You haven't written any journal entries yet. Write your first one to get personalized feedback!
            </p>
            <Button asChild size="lg">
              <Link href="/journal">Write First Entry</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <DashboardSummary totalEntries={analytics.totalEntries} averageScore={analytics.averageScore} weakestSkill={analytics.weakestSkill} />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <SrsForecastCard dueCounts={analytics.dueCounts} />
            <GoalProgressCard goals={user.goals} journalsThisWeek={analytics.journalsThisWeek} />
          </div>

          {user && ["PRO", "ADMIN"].includes(user.subscriptionTier) ? (
            <>
              <div className="grid gap-8 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Proficiency Over Time</CardTitle>
                    {showPredictions && <PredictionHorizonSelector value={predictionHorizon} onChange={setPredictionHorizon} />}
                  </CardHeader>
                  <CardContent>
                    <PredictionInfo totalEntries={analytics.totalEntries} />
                    <ProficiencyChart data={chartData.proficiency} predictionData={chartData.prediction} timeRange={chartTimeRange} isLoading={isAnalyticsFetching} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Skill Breakdown</CardTitle></CardHeader>
                  <CardContent><SubskillScores data={skillBreakdown} /></CardContent>
                </Card>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Subskill Progression</CardTitle>
                    {showPredictions && <PredictionHorizonSelector value={predictionHorizon} onChange={setPredictionHorizon} />}
                  </CardHeader>
                  <CardContent>
                    <PredictionInfo totalEntries={analytics.totalEntries} />
                    <SubskillProgressChart data={chartData.subskill} predictionData={chartData.subskillPrediction} timeRange={chartTimeRange} isLoading={isAnalyticsFetching} />
                  </CardContent>
                </Card>
                <ChallengingConceptsCard concepts={practiceAnalytics} isLoading={isPracticeAnalyticsLoading} onPractice={(concept) => setPracticeConcept(concept)} />
              </div>
            </>
          ) : (
            <Card><CardHeader><CardTitle>Upgrade to Pro for Detailed Analytics</CardTitle></CardHeader><CardContent><PricingTable /></CardContent></Card>
          )}

          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <JournalHistoryList journals={mappedJournals} />
        </>
      )}

      <div className="space-y-4">
        <Button onClick={handleGenerateTopics} disabled={isLoadingTopics}>
          {isLoadingTopics ? "Generating..." : "Suggest New Topics"}
        </Button>
        <SuggestedTopics topics={suggestedTopics?.topics || []} isLoading={isLoadingTopics} />
        {!isLoadingTopics && (!suggestedTopics || !suggestedTopics.topics || suggestedTopics.topics.length === 0) && (
          <p className="text-muted-foreground text-sm">No suggestions yet. Click 'Suggest New Topics' to get some ideas!</p>
        )}
      </div>

      <Dialog open={!!practiceConcept} onOpenChange={(isOpen) => !isOpen && setPracticeConcept(null)}>
        <DialogContent className="grid grid-rows-[auto_1fr] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Practice Concept</DialogTitle>
            <DialogDescription>"{practiceConcept?.explanation}"</DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-y-auto">{practiceConcept && (<PracticeSection mistakeId={practiceConcept.mistakeId} originalText={practiceConcept.originalText} correctedText={practiceConcept.correctedText} explanation={practiceConcept.explanation} />)}</div>
        </DialogContent>
      </Dialog>
      
      {hasEntries && (
        <Button className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6 rounded-full h-14 w-14 shadow-lg" onClick={() => setIsTutorOpen(true)}>
          <MessageSquarePlus className="h-6 w-6" />
          <span className="sr-only">Ask AI Coach</span>
        </Button>
      )}
      
      <TutorChatDialog
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        contextTitle="Chat with your AI Coach"
        contextDescription="Ask about your progress, study plan, or anything else about your language journey."
        chatHistory={tutorHistory}
        onSendMessage={handleSendTutorMessage}
        isLoading={tutorChatMutation.isPending}
      >
        {isTutorGreetingLoading && (
          <div className="flex justify-center items-center h-full"><Spinner /></div>
        )}
        {tutorGreetingError && (
          <div className="text-destructive text-center p-4">{tutorGreetingError}</div>
        )}
      </TutorChatDialog>
    </div>
  );
}