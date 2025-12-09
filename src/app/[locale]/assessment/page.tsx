'use client'
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
import { LabsAndImaging } from "@/components/assessment/LabsAndImaging";
import { FunctionalStatus } from "@/components/assessment/FunctionalStatus";
import { SmokingDetails } from "@/components/assessment/SmokingDetails";
import { Medications } from "@/components/assessment/Medications";
import { StandardizationService } from "@/lib/services/standardization.service";
import { DerivedVariablesService } from "@/lib/services/derived-variables.service";

interface Question {
  id: string;
  text?: string;
  type: "select" | "number_input" | "date_input" | "consent_checkbox" | "checkbox_group" | "advanced_modules";
  options?: any; // Can be string[], CheckboxOption[], or complex objects for modules
  dependsOn?: {
    questionId: string;
    value: string | boolean | string[];
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
      setTotalSteps(questionnaire.steps.length);
    }
  }, [questionnaire, setTotalSteps]);

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
          const option = symptomOptions.find((opt: any) => opt.id === id);
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
    // Adult Gate Logic
    if (answers.dob) { 
        try {
             const standardized = StandardizationService.standardize(answers);
             const derived = DerivedVariablesService.calculateAll(standardized);
             if (derived.adult_gate_ok === false) {
                 setLocalErrors(prev => ({ ...prev, dob: "You must be 18 or older to proceed." }));
                 return;
             } else {
                 setLocalErrors(prev => {
                     const newErrors = {...prev};
                     delete newErrors.dob;
                     return newErrors;
                 });
             }
        } catch (e) {
            console.error("Gate check failed", e);
        }
    }

    if (currentStep < totalSteps - 1) {
      nextStep();
    } else {
      router.push("/results");
    }
  };

  const handleStartNew = () => {
    reset();
    setShowResumeDialog(false);
  };

  const validateInput = (id: string, value: string, type: Question['type']): string | null => {
    if (type === 'date_input' && id === 'dob') {
        if (!value) return "This field is required.";
        if (new Date(value) > new Date()) return "Date of birth cannot be in the future.";
    }
    if (type === 'number_input') {
        if (!value.trim()) return null; // Allow empty optional fields
        const num = Number(value);
        if (isNaN(num)) return t('validNumber');
        if (num <= 0) return t('positiveValue');
        if (id === 'height_cm' && (num < 50 || num > 250)) return "Height must be between 50 and 250 cm.";
        if (id === 'weight_kg' && (num < 30 || num > 300)) return "Weight must be between 30 and 300 kg.";
    }
    return null;
  };

  const handleInputChange = (id: string, value: string, type: Question['type']) => {
      const error = validateInput(id, value, type);
      setLocalErrors(prev => ({ ...prev, [id]: error || '' }));
      setAnswer(id, value);
  };

  const isQuestionVisible = (question: Question) => {
    if (!question.dependsOn) return true;
    const dependencyAnswer = answers[question.dependsOn.questionId];
    if (typeof question.dependsOn.value === 'boolean') {
      if (question.dependsOn.value) {
        return !!dependencyAnswer && dependencyAnswer !== '[]' && dependencyAnswer !== 'false' && dependencyAnswer !== '["HP:0000000"]';
      } else {
        return !dependencyAnswer || dependencyAnswer === '[]' || dependencyAnswer === 'false' || dependencyAnswer === '["HP:0000000"]';
      }
    }
    if(Array.isArray(question.dependsOn.value)){
      return question.dependsOn.value.includes(dependencyAnswer);
    }
    return dependencyAnswer === question.dependsOn.value;
  };

  const stepData = questionnaire?.steps[currentStep];
  const visibleQuestions = stepData?.questions.filter(isQuestionVisible) || [];

  const isStepComplete = () => {
    if (!questionnaire) return false;
    const allAnswered = visibleQuestions.every((q) => {
      if (q.type === "consent_checkbox") return answers[q.id] === "true";
      if (q.type === "checkbox_group") {
        const value = answers[q.id];
        if (!value) return false;
        try { return JSON.parse(value).length > 0; } catch { return false; }
      }
      if (q.type === "advanced_modules") return true;
      // Make non-required fields optional for completion check
      if (['gender_identity', 'height_cm', 'weight_kg', 'diet_pattern', 'activity_level'].includes(q.id)) return true;
      return answers[q.id] && answers[q.id].trim() !== "";
    });
    const noErrors = visibleQuestions.every((q) => !localErrors[q.id]);
    return allAnswered && noErrors;
  };
  
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

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
        <p className="text-destructive">{t("loadingError", { error: (error as Error).message })}</p>
      </div>
    );
  }

  const advancedModules = questionnaire?.steps.flatMap(step => step.questions).find((q: Question) => q.id === 'advanced_modules')?.modules || [];
  const symptomDetailsOptions = advancedModules.find((m: { id: string; options?: any }) => m.id === 'symptom_details')?.options;


  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 bg-white text-black md:hidden"><AppHeaderContent /></header>
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>{t("resumeDialogTitle")}</DialogTitle><DialogDescription>{t("resumeDialogDescription")}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={handleStartNew}>{t("resumeDialogStartNew")}</Button><Button onClick={() => setShowResumeDialog(false)}>{t("resumeDialogResume")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-grow md:grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between p-12 bg-white text-black"><AppHeaderContent /><DisclaimerFooterContent /></div>
        <main className="bg-black text-white w-full flex flex-col flex-grow sm:items-center sm:justify-center p-4 pb-24 md:pb-4">
          <div className="w-full max-w-md space-y-8">
            <div className=" justify-center w-full hidden sm:flex"><LanguageSwitcher /></div>
            <div>
              <Progress value={progressPercentage} className="mb-4 h-3" indicatorClassName="bg-primary" />
              <h1 className="text-2xl font-bold">{stepData?.title}</h1>
              {stepData?.description && <p className="text-gray-400 mt-2">{stepData.description}</p>}
            </div>
            {showSafetyBanner && <SafetyBanner />}
            <section className="space-y-6">
              {visibleQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  {q.text && (
                     <div className="flex items-center gap-2">
                        <Label htmlFor={q.id}>{q.text}</Label>
                        {q.tooltip && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{q.tooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                     </div>
                  )}
                  {q.type === "select" && <Select onValueChange={(v) => setAnswer(q.id, v)} value={answers[q.id] || ""}><SelectTrigger id={q.id}><SelectValue placeholder={t("selectOption")} /></SelectTrigger><SelectContent>{q.options.map((o: any) => {
                    if (typeof o === 'object' && o.value && o.label) {
                      return <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>;
                    }
                    return <SelectItem key={o} value={o}>{o}</SelectItem>;
                  })}</SelectContent></Select>}
                  {q.type === "number_input" && <><Input id={q.id} type="number" value={answers[q.id] || ""} onChange={(e) => handleInputChange(q.id, e.target.value, q.type)} aria-invalid={!!localErrors[q.id]} className={localErrors[q.id] ? "border-destructive" : ""} /><p className="text-sm text-destructive">{localErrors[q.id]}</p></>}
                  {q.type === "date_input" && <><Input id={q.id} type="date" value={answers[q.id] || ""} onChange={(e) => handleInputChange(q.id, e.target.value, q.type)} aria-invalid={!!localErrors[q.id]} className={localErrors[q.id] ? "border-destructive" : ""} /><p className="text-sm text-destructive">{localErrors[q.id]}</p></>}
                  {q.type === "consent_checkbox" && <div className="flex items-start space-x-3 rounded-md border p-4"><Checkbox id={q.id} checked={answers[q.id] === "true"} onCheckedChange={(c) => setAnswer(q.id, c ? "true" : "false")} /><div className="grid gap-1.5"><label htmlFor={q.id} className="text-sm leading-snug text-muted-foreground">{t.rich("consentHealth", { privacyLink: (chunks) => <Link href="/privacy" className="font-semibold text-primary hover:underline" target="_blank" rel="noopener noreferrer">{chunks}</Link> })}</label></div></div>}
                  {q.type === "checkbox_group" && <CheckboxGroup options={q.options as CheckboxOption[]} value={answers[q.id] ? JSON.parse(answers[q.id]) : []} onChange={(s) => setAnswer(q.id, JSON.stringify(s))} exclusiveOption={q.exclusiveOptionId} />}
                  {q.type === 'advanced_modules' && <Accordion type="multiple" className="w-full">{q.modules?.filter(isQuestionVisible).map(m => <AccordionItem value={m.id} key={m.id}><AccordionTrigger>{m.title}</AccordionTrigger><AccordionContent>
                    {m.id === 'symptom_details' && <SymptomDetails selectedSymptoms={answers.symptoms ? questionnaire?.steps.flatMap(s => s.questions).find(q => q.id === 'symptoms')?.options?.filter((o: any) => JSON.parse(answers.symptoms).includes(o.id)) || [] : []} value={Object.keys(answers).reduce((acc, k) => { if(k.startsWith('symptom_details_')) { const sId=k.replace('symptom_details_',''); acc[sId]=JSON.parse(answers[k]);} return acc;}, {} as Record<string,any>)} onChange={(sId, d) => setAnswer(`symptom_details_${sId}`, JSON.stringify(d))} symptomOptions={symptomDetailsOptions?.symptomList || []} featureOptions={symptomDetailsOptions?.associatedFeatures || []} />}
                    {m.id === 'family_cancer_history' && <FamilyCancerHistory value={answers.family_cancer_history ? JSON.parse(answers.family_cancer_history) : []} onChange={(v) => setAnswer('family_cancer_history', JSON.stringify(v))} options={m.options} />}
                    {m.id === 'genetics' && <Genetics answers={answers} onAnswer={setAnswer} questions={m.questions} />}
                    {m.id === 'female_health' && <FemaleHealth answers={answers} onAnswer={setAnswer} questions={m.questions} />}
                    {m.id === 'personal_medical_history' && <PersonalMedicalHistory answers={answers} onAnswer={setAnswer} options={m.options} />}
                    {m.id === 'personal_cancer_history' && <PersonalCancerHistory value={answers.personal_cancer_history ? JSON.parse(answers.personal_cancer_history) : []} onChange={(v) => setAnswer('personal_cancer_history', JSON.stringify(v))} options={m.options} />}
                    {m.id === 'screening_immunization' && <ScreeningHistory answers={answers} onAnswer={setAnswer} screeningGroups={m.screenings} immunizationQuestions={m.immunizations}/>}
                    {m.id === 'medications_iatrogenic' && <Medications answers={answers} onAnswer={setAnswer} questions={m.questions} />}
                    {m.id === 'sexual_health' && <SexualHealth answers={answers} onAnswer={setAnswer} questions={m.questions} />}
                    {m.id === 'occupational_hazards' && <OccupationalHazards value={answers.occupational_hazards ? JSON.parse(answers.occupational_hazards) : []} onChange={(v) => setAnswer('occupational_hazards', JSON.stringify(v))} options={m.options} questions={m.questions} answers={answers} onAnswer={setAnswer}/>}
                    {m.id === 'environmental_exposures' && <EnvironmentalExposures answers={answers} onAnswer={setAnswer} questions={m.questions} />}
                    {m.id === 'labs_and_imaging' && <LabsAndImaging value={answers.labs_and_imaging ? JSON.parse(answers.labs_and_imaging) : []} onChange={(v) => setAnswer('labs_and_imaging', JSON.stringify(v))} options={m.options} />}
                    {m.id === 'functional_status' && <FunctionalStatus answers={answers} onAnswer={setAnswer} questions={m.questions} />}
                    {m.id === 'smoking_details' && <SmokingDetails answers={answers} onAnswer={setAnswer} questions={m.questions} />}
                  </AccordionContent></AccordionItem>)}</Accordion>}
                </div>
              ))}
            </section>
            <footer className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="rounded-none">{t("back")}</Button>
              <Button variant="default" onClick={handleNext} disabled={!isStepComplete()} className="rounded-none disabled:opacity-50">{currentStep === totalSteps - 1 ? t("viewResults") : t("next")}</Button>
            </footer>
          </div>
        </main>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white text-black md:hidden border-t"><DisclaimerFooterContentMobile /></footer>
    </div>
  );
}
