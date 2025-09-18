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
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SymptomDetails } from "@/components/assessment/SymptomDetails";
import { FamilyCancerHistory } from "@/components/assessment/FamilyCancerHistory";
import { Genetics } from "@/components/assessment/Genetics";
import { FemaleHealth } from "@/components/assessment/FemaleHealth";
import { PersonalMedicalHistory } from "@/components/assessment/PersonalMedicalHistory";
import { PersonalCancerHistory } from "@/components/assessment/PersonalCancerHistory";
import { ScreeningHistory } from "@/components/assessment/ScreeningHistory";
import { SexualHealth } from "@/components/assessment/SexualHealth";
import { OccupationalHazards } from "@/components/assessment/OccupationalHazards";
import { EnvironmentalExposures } from "@/components/assessment/EnvironmentalExposures";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { SafetyBanner } from "@/components/assessment/SafetyBanner";

interface Question {
  id: string;
  text: string;
  type: "select" | "number_input" | "consent_checkbox" | "checkbox_group" | "advanced_modules" | "year_input";
  options?: any[]; // Can be string[] or CheckboxOption[]
  dependsOn?: {
    questionId: string;
    value: string | boolean;
  };
  exclusiveOptionId?: string;
  modules?: any[];
  tooltip?: string;
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
  const [showSafetyBanner, setShowSafetyBanner] = useState(false);

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
      console.log("[DEBUG] Questionnaire data received on client:", questionnaire);
      setTotalSteps(questionnaire.steps.length);
    }
  }, [questionnaire, setTotalSteps]);

  // Safety Banner Logic
  useEffect(() => {
    if (!questionnaire) return;
    const symptomsAnswer = answers.symptoms;
    if (symptomsAnswer) {
      try {
        const selectedIds = JSON.parse(symptomsAnswer);
        const symptomOptions = questionnaire.steps
          .flatMap(s => s.questions)
          .find(q => q.id === 'symptoms')?.options || [];
        
        const hasRedFlag = selectedIds.some((id: string) => {
          const option = symptomOptions.find(opt => opt.id === id);
          return option?.red_flag;
        });
        setShowSafetyBanner(hasRedFlag);
      } catch (e) {
        setShowSafetyBanner(false);
      }
    } else {
       setShowSafetyBanner(false);
    }
  }, [answers.symptoms, questionnaire]);

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

  const isQuestionVisible = (question: Question) => {
    if (!question.dependsOn) return true;
    const dependencyAnswer = answers[question.dependsOn.questionId];
    if(typeof question.dependsOn.value === 'boolean') {
        if(question.dependsOn.value) {
            // "depends on being answered" logic
            return !!dependencyAnswer && dependencyAnswer !== '[]' && dependencyAnswer !== 'false' && dependencyAnswer !== '["none"]';
        } else {
            return !dependencyAnswer || dependencyAnswer === '[]' || dependencyAnswer === 'false' || dependencyAnswer === '["none"]';
        }
    }
    if (!dependencyAnswer) return false;
    return dependencyAnswer === question.dependsOn.value;
  };

  const visibleQuestions = stepData?.questions.filter(isQuestionVisible) || [];

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
       if (q.type === "advanced_modules") {
        return true; // The container itself requires no validation
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
            {showSafetyBanner && <SafetyBanner />}
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
                  {question.type !== "consent_checkbox" && question.type !== 'advanced_modules' && (
                    <div className="flex items-center gap-2">
                       <Label htmlFor={question.id}>{question.text}</Label>
                       {question.tooltip && (
                         <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                              <TooltipContent><p>{question.tooltip}</p></TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                       )}
                    </div>
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
                  {question.type === 'advanced_modules' && (
                    <Accordion type="multiple" className="w-full">
                       {question.modules?.filter(isQuestionVisible).map(module => {
                        if (module.id === 'symptom_details') {
                          const selectedSymptoms = answers.symptoms ?
                                    questionnaire?.steps.flatMap(s => s.questions).find(q => q.id === 'symptoms')?.options?.filter(opt => JSON.parse(answers.symptoms).includes(opt.id)) || []
                                    : [];
                          console.log("[DEBUG] `answers.symptoms`:", answers.symptoms);
                          console.log("[DEBUG] Calculated `selectedSymptoms` prop:", selectedSymptoms);

                          return (
                            <AccordionItem value={module.id} key={module.id}>
                              <AccordionTrigger>{module.title}</AccordionTrigger>
                              <AccordionContent>
                                <SymptomDetails 
                                  selectedSymptoms={selectedSymptoms}
                                  value={
                                    Object.keys(answers).reduce((acc, key) => {
                                      if (key.startsWith('symptom_details_')) {
                                        const symptomId = key.replace('symptom_details_', '');
                                        acc[symptomId] = JSON.parse(answers[key]);
                                      }
                                      return acc;
                                    }, {} as Record<string, any>)
                                  }
                                  onChange={(symptomId, details) => {
                                    setAnswer(`symptom_details_${symptomId}`, JSON.stringify(details))
                                  }}
                                />
                              </AccordionContent>
                            </AccordionItem>
                          );
                        }
                        
                        return (
                          <AccordionItem value={module.id} key={module.id}>
                            <AccordionTrigger>{module.title}</AccordionTrigger>
                            <AccordionContent>
                                {module.id === 'family_cancer_history' && (
                                  <FamilyCancerHistory 
                                    value={answers.family_cancer_history ? JSON.parse(answers.family_cancer_history) : []}
                                    onChange={(value) => setAnswer('family_cancer_history', JSON.stringify(value))}
                                    options={module.options}
                                  />
                                )}
                                {module.id === 'genetics' && (
                                  <Genetics
                                    answers={answers}
                                    onAnswer={setAnswer}
                                    questions={module.questions}
                                  />
                                )}
                                {module.id === 'female_health' && (
                                  <FemaleHealth
                                    answers={answers}
                                    onAnswer={setAnswer}
                                    questions={module.questions}
                                  />
                                )}
                                {module.id === 'personal_medical_history' && (
                                  <PersonalMedicalHistory
                                    answers={answers}
                                    onAnswer={setAnswer}
                                    options={module.options}
                                  />
                                )}
                                 {module.id === 'personal_cancer_history' && (
                                  <PersonalCancerHistory
                                    value={answers.personal_cancer_history ? JSON.parse(answers.personal_cancer_history) : []}
                                    onChange={(value) => setAnswer('personal_cancer_history', JSON.stringify(value))}
                                    options={module.options}
                                  />
                                )}
                                {module.id === 'screening_immunization' && (
                                  <ScreeningHistory
                                    answers={answers}
                                    onAnswer={setAnswer}
                                    questions={module.questions}
                                  />
                                )}
                                {module.id === 'sexual_health' && (
                                  <SexualHealth
                                    answers={answers}
                                    onAnswer={setAnswer}
                                    questions={module.questions}
                                  />
                                )}
                                {module.id === 'occupational_hazards' && (
                                  <OccupationalHazards
                                    value={answers.occupational_hazards ? JSON.parse(answers.occupational_hazards) : []}
                                    onChange={(value) => setAnswer('occupational_hazards', JSON.stringify(value))}
                                    options={module.options}
                                  />
                                )}
                                 {module.id === 'environmental_exposures' && (
                                  <EnvironmentalExposures
                                    answers={answers}
                                    onAnswer={setAnswer}
                                    questions={module.questions}
                                  />
                                )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                       })}
                    </Accordion>
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
