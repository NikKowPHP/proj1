import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateSrsFromMistake } from "@/lib/hooks/data";
import { Check, Lightbulb, MessageSquarePlus } from "lucide-react";
import { PracticeSection } from "./PracticeSection";
import { Textarea } from "./ui/textarea";
import { useEvaluateUserSentence } from "@/lib/hooks/data/useEvaluateUserSentence";
import Spinner from "./ui/Spinner";
import { useLanguageStore } from "@/lib/stores/language.store";
import { cn } from "@/lib/utils";
import { GuidedPopover } from "./ui/GuidedPopover";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface FeedbackCardProps {
  original: string;
  suggestion: string;
  explanation: string;
  mistakeId: string;
  onOnboardingAddToDeck?: () => void;
  isAlreadyInDeck: boolean;
  isOnboarding?: boolean;
  onAskTutor: (mistake: {
    original: string;
    corrected: string;
    explanation: string;
    mistakeId: string;
  }) => void;
}

function AddMistakeToDeckButton({
  mistakeId,
  onOnboardingAddToDeck,
  isAlreadyInDeck,
  original,
  suggestion,
  explanation,
}: {
  mistakeId: string;
  onOnboardingAddToDeck?: () => void;
  isAlreadyInDeck: boolean;
  original: string;
  suggestion: string;
  explanation: string;
}) {
  const { mutate, isPending, isSuccess } = useCreateSrsFromMistake();

  const showAddedState = isSuccess || isAlreadyInDeck;

  return (
    <Button
      variant="secondary"
      className="flex-1 py-2 md:py-0"
      onClick={() => {
        mutate(
          {
            mistakeId,
            frontContent: original,
            backContent: suggestion,
            context: explanation,
          },
          {
            onSuccess: () => onOnboardingAddToDeck?.(),
          },
        );
      }}
      disabled={isPending || showAddedState}
    >
      {isPending ? (
        "Adding..."
      ) : showAddedState ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added
        </>
      ) : (
        "Add to Study Deck"
      )}
    </Button>
  );
}

const UserExampleSection = ({ concept }: { concept: string }) => {
  const [sentence, setSentence] = useState("");
  const {
    mutate: evaluate,
    isPending,
    data: result,
    error,
  } = useEvaluateUserSentence();
  const { activeTargetLanguage } = useLanguageStore();

  const handleCheck = () => {
    if (sentence.trim() && activeTargetLanguage) {
      evaluate({ sentence, concept, targetLanguage: activeTargetLanguage });
    }
  };

  const feedbackColor =
    result?.isCorrect === true
      ? "text-green-600 dark:text-green-400"
      : result?.isCorrect === false
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="space-y-2 p-4 border-t">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Lightbulb className="h-4 w-4" />
        Practice with your own sentence
      </h4>
      <Textarea
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        placeholder="Write a new sentence using this concept..."
        rows={2}
      />
      <div className="flex justify-end">
        <Button onClick={handleCheck} disabled={isPending || !sentence.trim()}>
          {isPending && <Spinner size="sm" className="mr-2" />}
          Check Sentence
        </Button>
      </div>
      {result && (
        <p className={cn("text-xs animate-in fade-in", feedbackColor)}>
          {result.feedback}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive">
          Error: {error.message}
        </p>
      )}
    </div>
  );
};


export function FeedbackCard({
  original,
  suggestion,
  explanation,
  mistakeId,
  onOnboardingAddToDeck,
  isAlreadyInDeck,
  isOnboarding = false,
  onAskTutor,
}: FeedbackCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPopoverDismissed, setIsPopoverDismissed] = useState(false);
  const analytics = useAnalytics();

  const revealedContent = (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h3 className="text-base font-medium">Suggested Correction</h3>
        <p className="text-sm text-green-700 dark:text-green-400">
          {suggestion}
        </p>
      </div>
      <UserExampleSection concept={explanation} />
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1 py-2 md:py-0"
          onClick={() => onAskTutor({ original, corrected: suggestion, explanation, mistakeId })}
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Ask AI Tutor
        </Button>
        <AddMistakeToDeckButton
          mistakeId={mistakeId}
          onOnboardingAddToDeck={onOnboardingAddToDeck}
          isAlreadyInDeck={isAlreadyInDeck}
          original={original}
          suggestion={suggestion}
          explanation={explanation}
        />
      </div>
      <PracticeSection
        originalText={original}
        correctedText={suggestion}
        explanation={explanation}
        mistakeId={mistakeId}
      />
    </div>
  );

  const cardContent = (
    <>
      <div className="space-y-2">
        <h3 className="text-base font-medium">Original Text</h3>
        <p className="text-sm line-through text-muted-foreground">{original}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-medium">Explanation</h3>
        <p className="text-sm text-muted-foreground">{explanation}</p>
      </div>

      {isRevealed ? (
        revealedContent
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsRevealed(true)}
        >
          Show Suggestion
        </Button>
      )}
    </>
  );

  return (
    <Card id={`mistake-${mistakeId}`} className="p-4 md:p-6 space-y-6">
      {isOnboarding ? (
        <GuidedPopover
          isOpen={!isPopoverDismissed}
          onDismiss={() => {
            setIsPopoverDismissed(true);
            analytics.capture("Onboarding Popover Dismissed", { step: "VIEW_ANALYSIS", popover: "Practice & Retain" });
          }}
          title="Practice & Retain"
          description="Practice this concept with targeted exercises, then add it to your study deck to remember it long-term."
        >
          {cardContent}
        </GuidedPopover>
      ) : (
        cardContent
      )}
    </Card>
  );
}