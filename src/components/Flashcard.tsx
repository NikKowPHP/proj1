import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { TTSButton } from "./ui/TTSButton";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  frontContent: string;
  backContent: string;
  context?: string | null;
  type?: string;
  nativeLanguage?: string | null;
  targetLanguage?: string | null;
  onReview?: (quality: number) => void;
  onOnboardingReview?: () => void;
  interval?: number;
  easeFactor?: number;
  showGradingButtons?: boolean;
}

const calculateNextIntervals = (interval: number, easeFactor: number) => {
  // Forgot (quality < 3)
  const forgotInterval = 1;

  // Good (quality = 3)
  const goodEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - 3) * (0.08 + (5 - 3) * 0.02)),
  );
  const goodInterval = interval === 1 ? 6 : Math.round(interval * goodEaseFactor);

  // Easy (quality = 5)
  const easyEaseFactor = Math.max(1.3, easeFactor + 0.1);
  const easyInterval = interval === 1 ? 6 : Math.round(interval * easyEaseFactor);

  return {
    forgot: forgotInterval,
    good: goodInterval,
    easy: easyInterval,
  };
};

const formatInterval = (days: number): string => {
  if (days < 1) return `<1d`;
  if (days < 31) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30.44)}mo`;
  return `${(days / 365.25).toFixed(1).replace(".0", "")}y`;
};

function getLanguageCode(value: string | null | undefined): string {
  if (!value) return "";
  const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
  return lang?.code || value;
}

export function Flashcard({
  frontContent,
  backContent,
  context,
  type,
  nativeLanguage,
  targetLanguage,
  onReview,
  onOnboardingReview,
  interval = 1,
  easeFactor = 2.5,
  showGradingButtons = true,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [frontContent]);

  const handleShowAnswer = () => {
    setIsFlipped(true);
  };

  const handleReview = (quality: number) => {
    onReview?.(quality);
    onOnboardingReview?.();
  };

  const backLangCode =
    type === "TRANSLATION"
      ? getLanguageCode(nativeLanguage)
      : getLanguageCode(targetLanguage);

  const nextIntervals = calculateNextIntervals(interval, easeFactor);

  return (
    <Card
      className={cn(
        "p-6 space-y-4 bg-gradient-to-br from-background to-muted/20 w-full md:max-w-md mx-auto flex flex-col min-h-[20rem] justify-between",
        "animate-in fade-in duration-300",
        !isFlipped && "cursor-pointer",
      )}
      onClick={!isFlipped ? handleShowAnswer : undefined}
    >
      <div className="flex-grow flex flex-col justify-center items-center">
        <div className="flex items-center justify-center p-4">
          <p className="text-lg font-medium text-center">{frontContent}</p>
          {targetLanguage && (
            <TTSButton
              text={frontContent}
              lang={getLanguageCode(targetLanguage)}
            />
          )}
        </div>

        {isFlipped && (
          <div className="animate-in fade-in duration-300 w-full">
            <hr className="my-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4">
                <p className="text-lg font-medium text-center">{backContent}</p>
                {backLangCode && (
                  <TTSButton text={backContent} lang={backLangCode} />
                )}
              </div>
              {context && (
                <div className="text-sm text-muted-foreground p-2 bg-secondary rounded-md">
                  {context}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t">
        {isFlipped ? (
          showGradingButtons && (
            <div className="flex justify-around gap-2 text-center">
              <div className="flex-1">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReview(0);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Forgot
                </Button>
                <span className="text-xs text-muted-foreground">
                  {formatInterval(nextIntervals.forgot)}
                </span>
              </div>
              <div className="flex-1">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReview(3);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Good
                </Button>
                <span className="text-xs text-muted-foreground">
                  {formatInterval(nextIntervals.good)}
                </span>
              </div>
              <div className="flex-1">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReview(5);
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Easy
                </Button>
                <span className="text-xs text-muted-foreground">
                  {formatInterval(nextIntervals.easy)}
                </span>
              </div>
            </div>
          )
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Click card to show answer
          </p>
        )}
      </div>
    </Card>
  );
}