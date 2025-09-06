"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessmentStore } from "@/lib/stores/assessment.store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

interface Question {
  id: string;
  text: string;
  type: "select" | "number_input";
  options?: string[];
  dependsOn?: {
    questionId: string;
    value: string;
  };
}

interface Step {
  title: string;
  description?: string;
  questions: Question[];
}

export default function AssessmentPage() {
  const t = useTranslations("AssessmentPage");
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const {
    currentStep,
    answers,
    setAnswer,
    nextStep,
    prevStep,
    totalSteps,
    setTotalSteps,
    reset,
    units,
    setUnits,
  } = useAssessmentStore();

  const [isClient, setIsClient] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && Object.keys(useAssessmentStore.getState().answers).length > 0) {
      setShowResumeDialog(true);
    }
  }, [isClient]);

  const {
    data: questionnaire,
    isLoading,
    error,
  } = useQuery<{ steps: Step[] }>({
    queryKey: ["questionnaire", locale],
    queryFn: () => apiClient.questionnaire.getActive(locale),
  });

  useEffect(() => {
    if (questionnaire) {
      setTotalSteps(questionnaire.steps.length);
    }
  }, [questionnaire, setTotalSteps]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      nextStep();
    } else {
      setAnswer("units", units);
      router.push("/results");
    }
  };

  const handleStartNew = () => {
    reset();
    setShowResumeDialog(false);
  };

  const validateNumberInput = (id: string, value: string): string | null => {
    if (!value.trim()) return t("requiredField");
    const num = Number(value);
    if (isNaN(num)) return t("validNumber");
    if (num <= 0) return t("positiveValue");

    if (id === "height" && units === "metric" && (num < 50 || num > 300))
      return t("heightMetricRange");
    if (id === "height" && units === "imperial" && (num < 20 || num > 120))
      return t("heightImperialRange");
    if (id === "weight" && units === "metric" && (num < 20 || num > 300))
      return t("weightMetricRange");
    if (id === "weight" && units === "imperial" && (num < 40 || num > 660))
      return t("weightImperialRange");

    return null;
  };

  const handleInputChange = (
    id: string,
    value: string,
    type: Question["type"],
  ) => {
    let error: string | null = null;
    if (type === "number_input") {
      error = validateNumberInput(id, value);
    }

    setLocalErrors((prev) => ({ ...prev, [id]: error || "" }));

    setAnswer(id, value);
  };

  if (isLoading || !isClient) {
    return (
      <div className="container mx-auto p-4 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-2xl text-center">
        <p className="text-destructive">
          {t("loadingError", { error: (error as Error).message })}
        </p>
      </div>
    );
  }

  const stepData = questionnaire?.steps[currentStep];
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const visibleQuestions =
    stepData?.questions.filter((q) => {
      if (!q.dependsOn) return true;
      const dependencyAnswer = answers[q.dependsOn.questionId];
      if (!dependencyAnswer) return false;

      const options =
        questionnaire?.steps
          .find((s) => s.questions.some((qs) => qs.id === q.dependsOn?.questionId))
          ?.questions.find((qs) => qs.id === q.dependsOn?.questionId)
          ?.options || [];
      const englishOptions = ["Current smoker", "Former smoker"];
      const polishOptions = ["Obecny palacz", "Były palacz"];

      let valueToCompare = q.dependsOn.value;
      if (locale === "pl" && englishOptions.includes(valueToCompare)) {
        const idx = englishOptions.indexOf(valueToCompare);
        if (idx > -1) {
          valueToCompare = polishOptions[idx];
        }
      }
      return dependencyAnswer === valueToCompare;
    }) || [];

  const isStepComplete = () => {
    if (!questionnaire) return false;

    const allAnswered = visibleQuestions.every(
      (q) => answers[q.id] && answers[q.id].trim() !== "",
    );
    const noErrors = visibleQuestions.every((q) => !localErrors[q.id]);

    return allAnswered && noErrors;
  };

  const hasHeightOrWeight = stepData?.questions.some(
    (q) => q.id === "height" || q.id === "weight",
  );

  return (
    <div className="grid md:grid-cols-2 min-h-screen bg-background text-foreground">
      {/* Left Column: Branding and Disclaimer */}
      <div className="hidden md:flex flex-col bg-secondary p-12 text-foreground">
        <div className="my-auto">
          <h1 className="text-3xl font-bold text-primary mb-4">ONKONO</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Your personalized guide to proactive cancer screening.
          </p>
          <div className="border-l-4 border-primary pl-6 space-y-4">
            <h2 className="text-lg font-semibold">Important Disclaimer</h2>
            <p className="text-sm text-muted-foreground">
              This tool provides information for educational purposes only and is
              not a substitute for professional medical advice, diagnosis, or
              treatment.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Always consult with a qualified healthcare provider</strong>{" "}
              regarding any medical concerns or before making any decisions
              related to your health.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ONKONO. All rights reserved.
        </div>
      </div>

      {/* Right Column: Assessment Form */}
      <main className="w-full flex flex-col items-center justify-center p-4 md:p-8">
        <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
          <DialogContent
            showCloseButton={false}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{t("resumeDialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("resumeDialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleStartNew}>
                {t("resumeDialogStartNew")}
              </Button>
              <Button onClick={() => setShowResumeDialog(false)}>
                {t("resumeDialogResume")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="w-full max-w-md space-y-8">
          <header>
            <Progress value={progressPercentage} className="mb-4" />
            <h1 className="text-3xl font-bold">{stepData?.title}</h1>
            <p className="text-muted-foreground mt-2">
              {t("step", {
                currentStep: currentStep + 1,
                totalSteps: totalSteps,
              })}
              {stepData?.description && (
                <span className="block mt-2">{stepData.description}</span>
              )}
            </p>
          </header>

          <section className="space-y-6">
            {currentStep === 0 && hasHeightOrWeight && (
              <div className="space-y-2">
                <Label>{t("units")}</Label>
                <Tabs
                  value={units}
                  onValueChange={(value) =>
                    setUnits(value as "metric" | "imperial")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="metric">{t("unitsMetric")}</TabsTrigger>
                    <TabsTrigger value="imperial">
                      {t("unitsImperial")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            {visibleQuestions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id}>{question.text}</Label>
                {question.type === "select" && (
                  <Select
                    onValueChange={(value) => setAnswer(question.id, value)}
                    value={answers[question.id] || ""}
                  >
                    <SelectTrigger id={question.id}>
                      <SelectValue placeholder={t("selectOption")} />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {question.type === "number_input" && (
                  <>
                    <Input
                      id={question.id}
                      type="number"
                      inputMode="decimal"
                      placeholder={
                        question.id === "height"
                          ? units === "metric"
                            ? t("heightPlaceholderMetric")
                            : t("heightPlaceholderImperial")
                          : units === "metric"
                          ? t("weightPlaceholderMetric")
                          : t("weightPlaceholderImperial")
                      }
                      value={answers[question.id] || ""}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value, question.type)
                      }
                      aria-invalid={!!localErrors[question.id]}
                      className={
                        localErrors[question.id] ? "border-destructive" : ""
                      }
                    />
                    {localErrors[question.id] && (
                      <p className="text-sm text-destructive">
                        {localErrors[question.id]}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </section>
          
          <footer className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              {t("back")}
            </Button>
            <Button onClick={handleNext} disabled={!isStepComplete()}>
              {currentStep === totalSteps - 1
                ? t("viewResults")
                : t("next")}
            </Button>
          </footer>
        </div>
      </main>
    </div>
  );
}
      