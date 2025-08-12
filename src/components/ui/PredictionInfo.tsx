
import React from "react";
import { Info } from "lucide-react";

const MIN_ENTRIES_FOR_PREDICTION = 7;
const STABLE_TREND_THRESHOLD = 10;

interface PredictionInfoProps {
  totalEntries: number;
}

const getMessage = (totalEntries: number): string | null => {
  if (totalEntries < MIN_ENTRIES_FOR_PREDICTION) {
    const remaining = MIN_ENTRIES_FOR_PREDICTION - totalEntries;
    return `Submit ${remaining} more journal entr${
      remaining > 1 ? "ies" : "y"
    } to unlock your personalized progress forecast.`;
  }
  if (totalEntries < STABLE_TREND_THRESHOLD) {
    return "Your initial forecast is ready! It will become more accurate as you continue to write.";
  }
  return null;
};

export const PredictionInfo = ({ totalEntries }: PredictionInfoProps) => {
  const message = getMessage(totalEntries);

  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 p-3 text-sm text-muted-foreground bg-secondary/50 rounded-md border mb-4">
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
};