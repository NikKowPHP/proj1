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
import { Link, useRouter, useParams } from "@/i18n/navigation";
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
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AppHeaderContent } from "@/components/AppHeaderContent";
import { DisclaimerFooterContent } from "@/components/DisclaimerFooterContent";
import { DisclaimerFooterContentMobile } from "@/components/DisclaimerFooterContentMobile";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxGroup, CheckboxOption } from "@/components/ui/CheckboxGroup";

interface Question {
  id: string;
  text: string;
  type: "select" | "number_input" | "consent_checkbox" | "checkbox_group";
  options?: any[]; // Can be string[] or CheckboxOption[]
  dependsOn?: {
    questionId: string;
    value: string;
  };
  exclusiveOptionId?: string;
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
    if (
      isClient &&
      Object.keys(useAssessmentStore.getState().answers).length > 0
    ) {
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
      return dependencyAnswer === q.dependsOn.value;
    }) || [];

  const isStepComplete = () => {
    if (!questionnaire) return false;

    const allAnswered = visibleQuestions.every((q) => {
      if (q.type === "consent_checkbox") {
        return answers[q.id] === "true";
      }
      if (q.type === "checkbox_group") {
        const value = answers[q.id];
        if (!value) return false;
        try {
          const arr = JSON.parse(value);
          return Array.isArray(arr) && arr.length > 0;
        } catch {
          return false;
        }
      }
      return answers[q.id] && answers[q.id].trim() !== "";
    });
    const noErrors = visibleQuestions.every((q) => !localErrors[q.id]);

    return allAnswered && noErrors;
  };

  const hasHeightOrWeight = stepData?.questions.some(
    (q) => q.id === "height" || q.id === "weight",
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile-Only Header (White Background) */}
      <header className="p-4 bg-white text-black md:hidden">
        <AppHeaderContent />
      </header>

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("resumeDialogTitle")}</DialogTitle>
            <DialogDescription>{t("resumeDialogDescription")}</DialogDescription>
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

      {/* Main Container */}
      <div className="flex flex-grow md:grid md:grid-cols-2">
        {/* Left Column (Desktop-Only, White Background) */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-white text-black">
          <AppHeaderContent />
          <DisclaimerFooterContent />
        </div>

        {/* Right Column / Main Form Content (Black Background) */}
        <main className="bg-black text-white w-full flex flex-col flex-grow sm:items-center sm:justify-center p-4 pb-24 md:pb-4">
          <div className="w-full max-w-md space-y-8">
            {/* Header section with Language Switcher */}
            <div className=" justify-center w-full hidden sm:flex">
              <LanguageSwitcher />
            </div>
            <div>
              <Progress
                value={progressPercentage}
                className="mb-4 h-3"
                indicatorClassName="bg-primary"
              />
              <h1 className="text-2xl font-bold">{stepData?.title}</h1>
              <p className="text-gray-400 mt-2">
                {t("step", {
                  currentStep: currentStep + 1,
                  totalSteps: totalSteps,
                })}
              </p>
            </div>

            <section className="space-y-6">
              {" "}
              {/* Enforces consistent vertical rhythm */}
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
                    <TabsList className="grid w-full grid-cols-2 p-1">
                      <TabsTrigger value="metric">
                        {t("unitsMetric")}
                      </TabsTrigger>
                      <TabsTrigger value="imperial">
                        {t("unitsImperial")}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
              {visibleQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  {question.type !== "consent_checkbox" && (
                    <Label htmlFor={question.id}>{question.text}</Label>
                  )}
                  {question.type === "select" && (
                    <Select
                      onValueChange={(value) => setAnswer(question.id, value)}
                      value={answers[question.id] || ""}
                    >
                      <SelectTrigger
                        id={question.id}
                        className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-primary"
                      >
                        <SelectValue
                          placeholder={t("selectOption")}
                          className="placeholder:text-gray-500"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(question.options as string[])?.map((option) => (
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
                          handleInputChange(
                            question.id,
                            e.target.value,
                            question.type,
                          )
                        }
                        aria-invalid={!!localErrors[question.id]}
                        className={`placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-primary ${
                          localErrors[question.id] ? "border-destructive" : ""
                        }`}
                      />
                      {localErrors[question.id] && (
                        <p className="text-sm text-destructive">
                          {localErrors[question.id]}
                        </p>
                      )}
                    </>
                  )}
                  {question.type === "consent_checkbox" && (
                    <div className="flex items-start space-x-3 rounded-md border p-4">
                      <Checkbox
                        id={question.id}
                        checked={answers[question.id] === "true"}
                        onCheckedChange={(checked) =>
                          setAnswer(question.id, checked ? "true" : "false")
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={question.id}
                          className="text-sm leading-snug text-muted-foreground"
                        >
                          {t.rich("consentHealth", {
                            privacyLink: (chunks) => (
                              <Link
                                href="/privacy"
                                className="font-semibold text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {chunks}
                              </Link>
                            ),
                          })}
                        </label>
                      </div>
                    </div>
                  )}
                  {question.type === "checkbox_group" && (
                    <CheckboxGroup
                      options={question.options as CheckboxOption[]}
                      value={
                        answers[question.id]
                          ? JSON.parse(answers[question.id])
                          : []
                      }
                      onChange={(selectedIds) =>
                        setAnswer(question.id, JSON.stringify(selectedIds))
                      }
                      exclusiveOption={question.exclusiveOptionId}
                    />
                  )}
                </div>
              ))}
            </section>
            <footer className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="rounded-none"
              >
                {t("back")}
              </Button>
              <Button
                variant="default"
                onClick={handleNext}
                disabled={!isStepComplete()}
                className="rounded-none disabled:opacity-50"
              >
                {currentStep === totalSteps - 1
                  ? t("viewResults")
                  : t("next")}
              </Button>
            </footer>
          </div>
        </main>
      </div>

      {/* Mobile-Only Footer (White Background) */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white text-black md:hidden border-t">
        <DisclaimerFooterContentMobile />
      </footer>
    </div>
  );
}
