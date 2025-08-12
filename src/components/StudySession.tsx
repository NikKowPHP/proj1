"use client";
import { useState, useEffect, useRef } from "react";
import { Flashcard } from "@/components/Flashcard";
import { useReviewSrsItem } from "@/lib/hooks/data";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";

interface StudyCard {
  id: string;
  frontContent: string;
  backContent: string;
  context: string | null;
  targetLanguage?: string;
  type: string;
  interval: number;
  easeFactor: number;
}

interface StudySessionProps {
  cards: StudyCard[];
  nativeLanguage?: string | null;
  targetLanguage?: string | null;
  isTourActive?: boolean;
  onOnboardingReview?: () => void;
  onNewSessionRequest: () => void;
}

export function StudySession({
  cards,
  nativeLanguage,
  targetLanguage,
  isTourActive = false,
  onOnboardingReview,
  onNewSessionRequest,
}: StudySessionProps) {
  // Initialize state directly from props. The parent component's `key` prop will
  // ensure this component is re-created with new props when a new session starts.
  const [sessionCards, setSessionCards] = useState<StudyCard[]>(cards);
  const [initialCardCount] = useState(cards.length);
  const [reviewedCount, setReviewedCount] = useState(0);

  const analytics = useAnalytics();
  const sessionStartedAnalyticsEventFired = useRef(false);
  const { setStep } = useOnboardingStore();

  useEffect(() => {
    if (
      initialCardCount > 0 &&
      !sessionStartedAnalyticsEventFired.current
    ) {
      analytics.capture("SRS Session Started", {
        cardCount: initialCardCount,
        language: targetLanguage,
      });
      sessionStartedAnalyticsEventFired.current = true;
    }
  }, [initialCardCount, targetLanguage, analytics]);

  const reviewMutation = useReviewSrsItem();
  const currentCard = sessionCards[0];

  const handleReview = (quality: number) => {
    if (!currentCard) return;

    setReviewedCount((prev) => prev + 1);

    analytics.capture("Card Reviewed", {
      cardId: currentCard.id,
      quality,
      type: currentCard.type,
      language: targetLanguage,
    });

    // Perform the mutation, which now includes an optimistic update.
    reviewMutation.mutate({ srsItemId: currentCard.id, quality });

    // Update the local session queue.
    const remainingCards = sessionCards.slice(1);
    let nextCards: StudyCard[];

    if (quality < 3) {
      // If "Forgot", re-add the card to the end of the queue.
      nextCards = [...remainingCards, currentCard];
    } else {
      // If "Good" or "Easy", just remove the card from the session.
      nextCards = remainingCards;
    }

    setSessionCards(nextCards);
  };

  return (
    <div className="space-y-6">
      {currentCard ? (
        <>
          <div className="text-xl font-semibold text-muted-foreground">
            Card {reviewedCount + 1} of {initialCardCount}
          </div>
          <Flashcard
            key={currentCard.id} // Re-keying the component ensures it resets state (like isFlipped)
            frontContent={currentCard.frontContent}
            backContent={currentCard.backContent}
            context={currentCard.context}
            type={currentCard.type}
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            interval={currentCard.interval}
            easeFactor={currentCard.easeFactor}
            onReview={handleReview}
            onOnboardingReview={isTourActive ? onOnboardingReview : undefined}
          />
        </>
      ) : (
        <div className="text-center p-6 border rounded-lg bg-muted/20">
          <h2 className="text-xl font-semibold mb-2">Session Complete!</h2>
          <p className="text-gray-600 mb-4">
            You reviewed {reviewedCount} cards. Great job!
          </p>
          <Button onClick={onNewSessionRequest}>Study More Cards</Button>
        </div>
      )}
    </div>
  );
}