import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  useDrillDownMistake,
  useEvaluateDrillDownAnswer,
  useCreateSrsFromPracticeMistake,
  useStudyDeck,
} from "@/lib/hooks/data";
import {
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  RefreshCw,
  Languages,
} from "lucide-react";
import Spinner from "./ui/Spinner";
import { useLanguageStore } from "@/lib/stores/language.store";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import type { EvaluateDrillDownAnswerResult } from "@/lib/types";
import { logger } from "@/lib/logger";
import { TranslatorDialog } from "./TranslatorDialog";

interface PracticeSectionProps {
  originalText: string;
  correctedText: string;
  explanation: string;
  mistakeId: string;
}

interface PracticeSentence {
  type: string;
  task: string;
  answer: string;
}

function AddPracticeItemToDeckButton({
  practiceSentence,
  evaluation,
  mistakeId,
  isAlreadyInDeck,
}: {
  practiceSentence: PracticeSentence;
  evaluation: EvaluateDrillDownAnswerResult;
  mistakeId: string;
  isAlreadyInDeck: boolean;
}) {
  const { activeTargetLanguage } = useLanguageStore();
  const { mutate, isPending, isSuccess } = useCreateSrsFromPracticeMistake();

  const handleAdd = () => {
    if (!activeTargetLanguage) return;
    mutate({
      frontContent: practiceSentence.task,
      backContent: evaluation.correctedAnswer,
      context: evaluation.feedback,
      targetLanguage: activeTargetLanguage,
      mistakeId: mistakeId,
    });
  };

  const showAddedState = isSuccess || isAlreadyInDeck;
  const buttonText = evaluation.isCorrect ? "Review Later" : "Add to Deck";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-2 py-1 h-auto text-xs"
      onClick={handleAdd}
      disabled={showAddedState || isPending}
    >
      {isPending ? (
        <Spinner size="sm" />
      ) : showAddedState ? (
        <>
          <Check className="h-3 w-3 mr-1" /> Added
        </>
      ) : (
        <>
          <PlusCircle className="h-3 w-3 mr-1" /> {buttonText}
        </>
      )}
    </Button>
  );
}

const TaskPrompt = ({ type, task }: { type: string; task: string }) => {
  switch (type) {
    case "fill-in-the-blank":
      const parts = task.split("____");
      return (
        <p className="text-muted-foreground">
          {parts[0]}
          <span className="font-bold text-foreground bg-secondary px-2 py-1 rounded-md mx-1">
            [ your answer ]
          </span>
          {parts[1]}
        </p>
      );
    case "rephrase":
      return (
        <div>
          <p className="text-xs text-muted-foreground">
            Rephrase the following sentence:
          </p>
          <p className="text-muted-foreground italic">"{task}"</p>
        </div>
      );
    case "translate":
    default:
      return <span className="text-muted-foreground">{task}</span>;
  }
};

export const PracticeSection = ({
  originalText,
  correctedText,
  explanation,
  mistakeId,
}: PracticeSectionProps) => {
  const { activeTargetLanguage } = useLanguageStore();
  const drillDownMutation = useDrillDownMistake();
  const evaluateAnswerMutation = useEvaluateDrillDownAnswer();

  const [practiceSentences, setPracticeSentences] = useState<
    PracticeSentence[]
  >([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<
    (EvaluateDrillDownAnswerResult | undefined)[]
  >([]);
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [activeAnswerIndex, setActiveAnswerIndex] = useState<number | null>(
    null,
  );

  const { data: studyDeck } = useStudyDeck({ includeAll: true });
  const addedPracticeItems = useMemo(() => {
    return new Set(studyDeck?.map((item: any) => item.frontContent));
  }, [studyDeck]);

  useEffect(() => {
    if (drillDownMutation.data?.practiceSentences) {
      const newSentences = drillDownMutation.data.practiceSentences;
      setPracticeSentences((prev) => [...prev, ...newSentences]);
      setUserAnswers((prev) => [
        ...prev,
        ...new Array(newSentences.length).fill(""),
      ]);
      setEvaluationResults((prev) => [
        ...prev,
        ...new Array(newSentences.length).fill(undefined),
      ]);
    }
  }, [drillDownMutation.data]);

  const handlePractice = (isGeneratingMore: boolean = false) => {
    if (!activeTargetLanguage) return;

    if (!isGeneratingMore) {
      // Reset state for the first generation
      setPracticeSentences([]);
      setUserAnswers([]);
      setEvaluationResults([]);
    }

    drillDownMutation.mutate({
      mistakeId,
      originalText,
      correctedText,
      explanation,
      targetLanguage: activeTargetLanguage,
      existingTasks: practiceSentences.map((s) => s.task),
    });
  };

  useEffect(() => {
    // On mount, automatically trigger practice generation if we don't have data,
    // aren't already fetching, and haven't encountered an error.
    if (
      !drillDownMutation.data &&
      !drillDownMutation.isPending &&
      !drillDownMutation.isError
    ) {
      handlePractice(false);
    }
  }, [
    mistakeId,
    drillDownMutation.data,
    drillDownMutation.isPending,
    drillDownMutation.isError,
  ]);

  const handleUserAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
    const newEvaluationResults = [...evaluationResults];
    newEvaluationResults[index] = undefined;
    setEvaluationResults(newEvaluationResults as any);
  };

  const handleCheckAnswers = async () => {
    if (practiceSentences.length === 0 || userAnswers.length === 0) return;

    const evaluationPromises = practiceSentences.map(
      (sentence, index: number) => {
        // If already evaluated, keep the old result
        if (evaluationResults[index]) {
          return Promise.resolve(evaluationResults[index]);
        }
        const userAnswerText = userAnswers[index] || "";
        if (userAnswerText.trim() === "") {
          return Promise.resolve(undefined);
        }
        return evaluateAnswerMutation.mutateAsync({
          mistakeId: mistakeId,
          taskPrompt: sentence.task,
          expectedAnswer: sentence.answer,
          userAnswer: userAnswerText,
          targetLanguage: activeTargetLanguage!,
        });
      },
    );

    try {
      const results = await Promise.all(evaluationPromises);
      setEvaluationResults(results);
    } catch (error) {
      logger.error("Error evaluating answers in PracticeSection", { error });
    }
  };

  const handleApplyTranslation = (text: string) => {
    if (activeAnswerIndex !== null) {
      const newAnswers = [...userAnswers];
      const currentAnswer = newAnswers[activeAnswerIndex] || "";
      newAnswers[activeAnswerIndex] = currentAnswer
        ? `${currentAnswer} ${text}`
        : text;
      setUserAnswers(newAnswers);
    }
  };

  const isGenerating = drillDownMutation.isPending;
  const isEvaluating = evaluateAnswerMutation.isPending;
  const hasPracticeSentences = practiceSentences.length > 0;
  const isAnyAnswerTyped = userAnswers.some((ans) => ans.trim().length > 0);

  // If we are generating for the first time, show a spinner.
  if (isGenerating && !hasPracticeSentences) {
    return (
      <div className="flex justify-center items-center min-h-[20rem]">
        <Spinner size="lg" />
      </div>
    );
  }

  // If the initial generation fails, show an error.
  if (drillDownMutation.isError && !hasPracticeSentences) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[20rem] text-center">
        <p className="text-destructive">Could not generate practice exercises.</p>
        <Button
          variant="link"
          onClick={() => {
            drillDownMutation.reset(); // Reset error state
            handlePractice(false);
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // If there are no sentences (e.g., AI returns an empty list), show a message.
  if (!hasPracticeSentences) {
    return (
      <div className="flex justify-center items-center min-h-[20rem] text-muted-foreground text-center">
        No practice exercises could be generated for this concept.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="p-4 bg-secondary/50 rounded-md space-y-4 animate-in fade-in">
        <ul className="space-y-4 text-sm max-h-96 overflow-y-auto pr-2">
          {practiceSentences.map((sentence, i: number) => {
            const evaluation = evaluationResults[i];
            const isCurrentAnswerCorrect = evaluation?.isCorrect;
            const feedbackColor =
              isCurrentAnswerCorrect === true
                ? "text-green-600 dark:text-green-400"
                : isCurrentAnswerCorrect === false
                ? "text-destructive dark:text-red-400"
                : "text-muted-foreground";

            const isItemAlreadyInDeck = addedPracticeItems.has(sentence.task);

            return (
              <li key={i} className="flex flex-col gap-1">
                <TaskPrompt type={sentence.type} task={sentence.task} />
                <Textarea
                  placeholder="Type your answer here..."
                  value={userAnswers[i] || ""}
                  onChange={(e) => handleUserAnswerChange(i, e.target.value)}
                  onFocus={() => setActiveAnswerIndex(i)}
                  rows={2}
                  className="bg-background text-foreground border-input focus:ring-primary focus:ring-offset-2"
                  disabled={isEvaluating}
                  style={{
                    borderColor: evaluationResults[i]
                      ? isCurrentAnswerCorrect
                        ? "var(--chart-2)"
                        : "var(--destructive)"
                      : "var(--border)",
                    borderWidth: evaluationResults[i] ? "2px" : "1px",
                  }}
                />
                {evaluation !== undefined && (
                  <div className={`text-xs ${feedbackColor} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <span>
                        {evaluation?.feedback}
                        {evaluation?.score !== undefined && (
                          <span className="font-semibold ml-1">
                            ({evaluation.score.toFixed(0)}%)
                          </span>
                        )}
                      </span>
                      <AddPracticeItemToDeckButton
                        practiceSentence={sentence}
                        evaluation={evaluation}
                        mistakeId={mistakeId}
                        isAlreadyInDeck={isItemAlreadyInDeck}
                      />
                    </div>
                    {evaluation?.score !== undefined && (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={evaluation.score}
                          className="h-1 w-full"
                        />
                      </div>
                    )}
                    {evaluation?.isCorrect === false && showAnswers && (
                      <span className="ml-0 italic font-normal">
                        (Correct: {evaluation.correctedAnswer})
                      </span>
                    )}
                  </div>
                )}
                {showAnswers && evaluation?.isCorrect !== false && (
                  <span className="ml-0 font-semibold text-primary">
                    Expected: {sentence.answer}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleCheckAnswers}
            disabled={isEvaluating || !isAnyAnswerTyped}
          >
            {isEvaluating ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isEvaluating ? "Checking..." : "Check Answers"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handlePractice(true)}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate More
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? (
              <ChevronUp className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            {showAnswers ? "Hide" : "Show"} Answers
          </Button>
          <Button variant="ghost" onClick={() => setIsTranslatorOpen(true)}>
            <Languages className="h-4 w-4 mr-2" /> Translate
          </Button>
        </div>
      </div>
      <TranslatorDialog
        open={isTranslatorOpen}
        onOpenChange={setIsTranslatorOpen}
        onApplyTranslation={handleApplyTranslation}
      />
    </div>
  );
};