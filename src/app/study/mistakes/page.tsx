"use client";
import { useState } from "react";
import { useMistakesData, useTutorChat, useUserProfile } from "@/lib/hooks/data";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
} from "lucide-react";
import type { TutorChatMessage } from "@/lib/types";
import { useLanguageStore } from "@/lib/stores/language.store";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { TutorChatDialog } from "@/components/TutorChatDialog";
import type { Mistake } from "@prisma/client";

function MistakeCard({
  mistake,
  onAskTutor,
}: {
  mistake: any;
  onAskTutor: (mistake: any) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          {new Date(mistake.createdAt).toLocaleDateString()}
        </p>
        <p className="text-sm line-through text-muted-foreground">
          {mistake.originalText}
        </p>
        <p className="text-sm text-green-600 dark:text-green-400">
          {mistake.correctedText}
        </p>
        <p className="text-xs italic text-muted-foreground">
          {mistake.explanation}
        </p>
      </CardContent>
      <CardFooter className="p-2 border-t">
        <Button variant="ghost" size="sm" onClick={() => onAskTutor(mistake)}>
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Ask AI Tutor
        </Button>
      </CardFooter>
    </Card>
  );
}

function SkeletonMistakeCard() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
}

export default function MistakeDiaryPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const { data, isLoading } = useMistakesData(page, typeFilter);

  // State for Tutor Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeMistake, setActiveMistake] = useState<Mistake | null>(null);
  const [chatHistory, setChatHistory] = useState<TutorChatMessage[]>([]);

  const { data: userProfile } = useUserProfile();
  const { activeTargetLanguage } = useLanguageStore();
  const tutorChatMutation = useTutorChat();
  const analytics = useAnalytics();

  const handleAskTutor = (mistake: Mistake) => {
    setActiveMistake(mistake);
    setChatHistory([
      {
        role: "assistant",
        content: `Hi there! I see you're looking at this correction. What would you like to know more about? You can ask for more examples, why the correction is better, or anything else about this specific point.`,
      },
    ]);
    setIsChatOpen(true);
    analytics.capture("TutorChat_Opened", {
      mistakeId: mistake.id,
      source: "MistakeDiary",
    });
  };

  const handleSendChatMessage = (userQuestion: string) => {
    if (!activeMistake || !activeTargetLanguage || !userProfile?.nativeLanguage)
      return;

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
      source: "MistakeDiary",
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

  return (
    <div className="container mx-auto p-4 space-y-6">
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

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mistake Diary</h1>
        <LanguageSwitcher />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => {
            setPage(1);
            setTypeFilter(v === "all" ? undefined : v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="grammar">Grammar</SelectItem>
            <SelectItem value="phrasing">Phrasing</SelectItem>
            <SelectItem value="vocabulary">Vocabulary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonMistakeCard key={i} />
          ))}
        </div>
      ) : !data || data.mistakes.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          No mistakes found for this language or filter.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {data.mistakes.map((mistake: any) => (
              <MistakeCard
                key={mistake.id}
                mistake={mistake}
                onAskTutor={handleAskTutor}
              />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.currentPage} of {data.totalPages}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page >= data.totalPages}
                variant="outline"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}