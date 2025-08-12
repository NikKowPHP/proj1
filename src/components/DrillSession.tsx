"use client";

import { useState, useEffect } from "react";
import { Flashcard } from "@/components/Flashcard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { DialogFooter } from "./ui/dialog";
import type { SrsDrillItem } from "@/lib/types";

interface DrillSessionProps {
  cards: SrsDrillItem[];
  nativeLanguage?: string | null;
  targetLanguage?: string | null;
  onEndDrill: () => void;
  onNewDrill: () => void;
}

export function DrillSession({
  cards,
  nativeLanguage,
  targetLanguage,
  onEndDrill,
  onNewDrill,
}: DrillSessionProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset the index when a new set of cards is provided.
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [cards]);

  const currentCard = cards[currentCardIndex];

  const handleNext = () => {
    setCurrentCardIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentCardIndex((prev) => prev - 1);
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center p-6 border rounded-lg bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">No Cards for Drill</h2>
        <p className="text-gray-600 mb-4">
          You need to review some cards in your study deck first to have items for a drill.
        </p>
        <DialogFooter className="mt-4">
          <Button onClick={onEndDrill} variant="secondary">
            Close
          </Button>
        </DialogFooter>
      </div>
    );
  }

  const isLastCard = currentCardIndex === cards.length - 1;
  const isFirstCard = currentCardIndex === 0;

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold text-muted-foreground">
        Card {currentCardIndex + 1} of {cards.length}
      </div>
      <div key={currentCard.id} className="animate-in fade-in duration-300">
        <Flashcard
          frontContent={currentCard.frontContent}
          backContent={currentCard.backContent}
          context={currentCard.context}
          type={currentCard.type}
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          showGradingButtons={false}
        />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button onClick={handlePrevious} disabled={isFirstCard} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {isLastCard ? (
          <Button onClick={onNewDrill} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Drill
          </Button>
        ) : (
          <Button onClick={handleNext} variant="default">
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}