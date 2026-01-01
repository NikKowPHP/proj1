'use client'
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip } from "@/components/ui/chip";
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
import { Slider } from "@/components/ui/slider";
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
import { GenericModule } from "@/components/assessment/GenericModule";
import { PersonalCancerHistory } from "@/components/assessment/PersonalCancerHistory";
import { ScreeningHistory } from "@/components/assessment/ScreeningHistory";
import { SexualHealth } from "@/components/assessment/SexualHealth";
import { OccupationalHazards } from "@/components/assessment/OccupationalHazards";
import { EnvironmentalExposures } from "@/components/assessment/EnvironmentalExposures";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertCircle } from "lucide-react";
import { SafetyBanner } from "@/components/assessment/SafetyBanner";
import { UnitToggle } from "@/components/assessment/UnitToggle";
import { LabsAndImaging } from "@/components/assessment/LabsAndImaging";
import { FunctionalStatus } from "@/components/assessment/FunctionalStatus";
import { SmokingDetails } from "@/components/assessment/SmokingDetails";
import { Medications } from "@/components/assessment/Medications";
import { StandardizationService } from "@/lib/services/standardization.service";
import { DerivedVariablesService } from "@/lib/services/derived-variables.service";
import { Card, CardContent } from "@/components/ui/card";
import { isQuestionVisible } from "@/lib/utils/question-visibility";

interface Question {
  id: string;
  text?: string;
  type: "select" | "number_input" | "date_input" | "consent_checkbox" | "checkbox_group" | "advanced_modules" | "radio" | "year_input" | "text_input" | "slider" | "checkbox";
  options?: any; // Can be string[], CheckboxOption[], or complex objects for modules
  dependsOn?: any;
  exclusiveOptionId?: string;
  modules?: any[];
  tooltip?: string;
  infoCard?: {
    id: string;
    text: string | { en: string; pl: string };
  };
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
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
  const [localWarnings, setLocalWarnings] = useState<Record<string, string>>({});
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

  // Family History Connection: Smart Pre-populate
  useEffect(() => {
    // Only run if user said "Yes" to family history
    if (answers['famhx.any_family_cancer'] !== 'Yes') return;

    const quickRelativesRaw = answers['famhx.quick_relatives_chips'];
    if (!quickRelativesRaw) return;

    try {
      const selectedRelatives: string[] = JSON.parse(quickRelativesRaw);

      // Parse existing advanced history
      let currentHistory: any[] = [];
      try {
        currentHistory = answers.family_cancer_history ? JSON.parse(answers.family_cancer_history) : [];
      } catch {
        currentHistory = [];
      }

      // Identify which selected relatives are NOT yet in the detailed history
      // We check by relationship label.
      const existingRelations = new Set(currentHistory.map(item => item.relation));
      const missingRelatives = selectedRelatives.filter(rel => !existingRelations.has(rel) && rel !== 'Other');

      if (missingRelatives.length > 0) {
        const newEntries = missingRelatives.map(rel => ({
          id: crypto.randomUUID(),
          relation: rel,
          // Auto-infer side for simple cases to save user clicks
          side_of_family: rel.includes('Maternal') || rel === 'Mother' ? 'Maternal' :
            rel.includes('Paternal') || rel === 'Father' ? 'Paternal' :
              ['Sister', 'Brother'].includes(rel) ? 'N/A' :
                ['Daughter', 'Son'].includes(rel) ? 'Both parents' : undefined,
          cancers: []
        }));

        const updatedHistory = [...currentHistory, ...newEntries];
        setAnswer('family_cancer_history', JSON.stringify(updatedHistory));
      }
    } catch (e) {
      console.error("Failed to sync family history", e);
    }
  }, [answers['famhx.any_family_cancer'], answers['famhx.quick_relatives_chips']]);

  const handleNext = () => {
    if (!validateStep()) {
      // Find the first error and scroll to it if possible? 
      // For now just showing errors is enough as per request.
      return;
    }

    // Adult Gate Logic
    if (answers.dob) {
      try {
        const standardized = StandardizationService.standardize(answers);
        const derived = DerivedVariablesService.calculateAll(standardized);
        if (derived.adult_gate_ok === false) {
          setLocalErrors(prev => ({ ...prev, dob: t('adultGateError') }));
          return;
        } else {
          setLocalErrors(prev => {
            const newErrors = { ...prev };
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

  const validateInput = (id: string, value: string, type: Question['type']): { error: string | null, warning: string | null } => {
    let error = null;
    let warning = null;

    if (type === 'date_input' && id === 'dob') {
      if (!value) error = t('requiredField');
      else if (new Date(value) > new Date()) error = "Date of birth cannot be in the future.";
    }
    if (type === 'year_input' && id === 'dob') {
      if (!value) error = t('requiredField');
      else {
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (isNaN(year)) error = t('validNumber');
        else if (year < 1900 || year > currentYear) error = `Year must be between 1900 and ${currentYear}`;
        else if ((currentYear - year) < 18) error = "You must be 18 or older to use this service.";
      }
    }

    if (type === 'number_input') {
      if (!value.trim()) return { error: null, warning: null }; // Allow empty optional fields
      const num = Number(value);
      if (isNaN(num)) error = t('validNumber');
      else if (num < 0) error = t('positiveValue');

      // Height validation (PDF Page 2)
      if (id === 'height_cm') {
        if (num < 50 || num > 250) error = t('heightMetricRange');
        else if (num < 120 || num > 220) warning = t('heightWarningMetric');
      }
      // Weight validation (PDF Page 2)
      if (id === 'weight_kg') {
        if (num < 30 || num > 300) error = t('weightMetricRange');
        else if (num < 40 || num > 220) warning = t('weightWarningMetric');
      }
    }
    return { error, warning };
  };

  const handleInputChange = (id: string, value: string, type: Question['type']) => {
    const { error, warning } = validateInput(id, value, type);
    setLocalErrors(prev => ({ ...prev, [id]: error || '' }));
    setLocalWarnings(prev => ({ ...prev, [id]: warning || '' }));
    setAnswer(id, value);
  };

  const stepData = questionnaire?.steps[currentStep];
  const visibleQuestions = stepData?.questions.filter(q => isQuestionVisible(q, answers)) || [];

  const validateStep = () => {
    console.log('validateStep', answers);
    console.log('questionnaire', questionnaire);
    console.log('currentStep', currentStep);
    console.log('visibleQuestions', visibleQuestions);
    if (!questionnaire) return false;
    let isValid = true;
    const newErrors: Record<string, string> = {};

    visibleQuestions.forEach((q) => {
      let isFieldValid = true;
      // Check strict requirements first
      if (q.type === "consent_checkbox") {
        if (answers[q.id] !== "true") isFieldValid = false;
      } else if (q.type === "checkbox_group") {
        const value = answers[q.id];
        try {
          if (!value || JSON.parse(value).length === 0) isFieldValid = false;
        } catch { isFieldValid = false; }
      } else if (q.type === "advanced_modules" || q.type === "checkbox") {
        isFieldValid = true;
      } else {
        // Standard fields
        const isOptional = ['gender_identity', 'height_cm', 'weight_kg', 'diet_pattern', 'activity_level'].includes(q.id);
        if (!isOptional) {
          if (!answers[q.id] || answers[q.id].trim() === "") isFieldValid = false;
        }
      }

      if (!isFieldValid) {
        newErrors[q.id] = t('requiredField');
        isValid = false;
      }

      // Also run standard validation
      if (answers[q.id]) {
        const { error } = validateInput(q.id, answers[q.id], q.type);
        if (error) {
          newErrors[q.id] = error;
          isValid = false;
        }
      }
    });

    // Custom Validation: Alcohol Percentages must sum to 100
    // Only validate if these questions are in the current step and visible
    const alcoholFields = ['alcohol.beer_pct', 'alcohol.wine_pct', 'alcohol.spirits_pct'];
    const stepHasAlcoholFields = visibleQuestions.some(q => alcoholFields.includes(q.id));

    if (stepHasAlcoholFields) {

      const beer = Number(answers['alcohol.beer_pct'] || 0);
      const wine = Number(answers['alcohol.wine_pct'] || 0);
      const spirits = Number(answers['alcohol.spirits_pct'] || 0);

      // Only validate if user has entered at least one non-zero value or if the fields are mandatory?
      // Usually these appear if they drink. 
      // If all are 0/empty, maybe not an error if they skip? But depends on requirements. 
      // Let's assume strict sum if they are visible.
      const total = beer + wine + spirits;
      if (total !== 100) {
        newErrors['alcohol.beer_pct'] = t('sum100');
        newErrors['alcohol.wine_pct'] = t('sum100');
        newErrors['alcohol.spirits_pct'] = t('sum100');
        isValid = false;
      }
    }

    console.log('newErrors', newErrors);
    setLocalErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const isStepComplete = () => {
    // Keep for progress calculation or other UI needs if necessary, 
    // but the button will rely on handleNext validation.
    // For now we can reuse validateStep logic or keep strict check without side effects if needed.
    // However, to keep it simple, we can just rely on validateStep returning false and setting errors.
    return true; // We don't want to block the button anymore
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

  const allAdvancedModules = questionnaire?.steps.flatMap(step => step.questions).filter((q: Question) => q.type === 'advanced_modules').flatMap(q => q.modules) || [];
  const symptomDetailsOptions = allAdvancedModules.find((m: { id: string; options?: any }) => m.id === 'symptom_details')?.options;


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
        <div className="hidden md:flex flex-col justify-between p-12 bg-white text-black sticky top-0 h-screen overflow-y-auto"><AppHeaderContent /><DisclaimerFooterContent /></div>
        <main className="bg-black text-white w-full flex flex-col flex-grow sm:items-center sm:justify-center p-4 pb-24 md:pb-4">
          <div className="w-full max-w-md space-y-8">
            <div className="flex justify-center w-full hidden sm:flex gap-4"><LanguageSwitcher /><UnitToggle /></div>
            <div>
              <Progress value={progressPercentage} className="mb-4 h-3" indicatorClassName="bg-primary" />
              <h1 className="text-2xl font-bold">{stepData?.title}</h1>
              {stepData?.description && <p className="text-gray-400 mt-2">{stepData.description}</p>}
            </div>
            {showSafetyBanner && <SafetyBanner answers={answers} symptomOptions={questionnaire?.steps.flatMap(s => s.questions).find(q => q.id === 'symptoms')?.options || []} />}
            <section className="space-y-6">
              {visibleQuestions.map((q) => (
                <div key={q.id} className="space-y-2 animate-fade-in">
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
                  {q.type === "select" && (
                    <>
                      <Select onValueChange={(v) => setAnswer(q.id, v)} value={answers[q.id] || ""}>
                        <SelectTrigger id={q.id} className={localErrors[q.id] ? "border-destructive" : ""}>
                          <SelectValue placeholder={t("selectOption")} />
                        </SelectTrigger>
                        <SelectContent>
                          {q.options.map((o: any) => {
                            if (typeof o === 'object' && o.value && o.label) {
                              return <SelectItem key={o.value} value={o.value}>{typeof o.label === 'object' ? (o.label as any)[locale] : o.label}</SelectItem>;
                            }
                            return <SelectItem key={o} value={o}>{o}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                      {localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}
                    </>
                  )}
                  {q.type === "radio" && (
                    <>
                      <Select onValueChange={(v) => setAnswer(q.id, v)} value={answers[q.id] || ""}>
                        <SelectTrigger id={q.id} className={localErrors[q.id] ? "border-destructive" : ""}>
                          <SelectValue placeholder={t("selectOption")} />
                        </SelectTrigger>
                        <SelectContent>
                          {q.options.map((o: any) => {
                            if (typeof o === 'object' && o.value && o.label) {
                              return <SelectItem key={o.value} value={o.value}>{typeof o.label === 'object' ? (o.label as any)[locale] : o.label}</SelectItem>;
                            }
                            return <SelectItem key={o} value={o}>{o}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                      {localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}
                    </>
                  )}
                  {q.type === "text_input" && (
                    <>
                      <Input
                        id={q.id}
                        type="text"
                        value={answers[q.id] || ""}
                        onChange={(e) => handleInputChange(q.id, e.target.value, q.type)}
                        aria-invalid={!!localErrors[q.id]}
                        className={localErrors[q.id] ? "border-destructive" : ""}
                        placeholder={q.placeholder}
                      />
                      {localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}
                    </>
                  )}
                  {q.type === "slider" && (
                    <>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[Number(answers[q.id] || 0)]}
                          max={q.max || 100}
                          min={q.min || 0}
                          step={q.step || 1}
                          onValueChange={(vals) => setAnswer(q.id, String(vals[0]))}
                          className="flex-1"
                        />
                        <span className="w-12 text-right">{answers[q.id] || 0}%</span>
                      </div>
                      {localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}
                    </>
                  )}
                  {q.type === "number_input" && (
                    <>
                      <Input id={q.id} type="number" value={answers[q.id] || ""} onChange={(e) => handleInputChange(q.id, e.target.value, q.type)} aria-invalid={!!localErrors[q.id]} className={localErrors[q.id] ? "border-destructive" : ""} />
                      {localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}
                      {localWarnings[q.id] && !localErrors[q.id] && (
                        <p className="text-sm text-yellow-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {localWarnings[q.id]}
                        </p>
                      )}
                    </>
                  )}
                  {q.type === "year_input" && (
                    <div className="flex items-center gap-2">
                      <Input id={q.id} type="number" inputMode="numeric" value={answers[q.id] || ""} onChange={(e) => handleInputChange(q.id, e.target.value, q.type)} aria-invalid={!!localErrors[q.id]} className={localErrors[q.id] ? "border-destructive" : ""} placeholder="YYYY" />
                      {q.id === 'dob' && answers[q.id] && !isNaN(parseInt(answers[q.id])) && parseInt(answers[q.id]) > 1900 && (
                        <Chip className="bg-primary/10 text-primary border-primary/20 shrink-0 h-10 px-3">
                          Age: {new Date().getFullYear() - parseInt(answers[q.id])} years
                        </Chip>
                      )}
                      <p className="text-sm text-destructive">{localErrors[q.id]}</p>
                    </div>
                  )}
                  {q.type === "date_input" && (
                    <div className="flex items-center gap-2">
                      <Input id={q.id} type="date" value={answers[q.id] || ""} onChange={(e) => handleInputChange(q.id, e.target.value, q.type)} aria-invalid={!!localErrors[q.id]} className={localErrors[q.id] ? "border-destructive" : ""} />
                      {q.id === 'dob' && answers[q.id] && !isNaN(new Date(answers[q.id]).getFullYear()) && (
                        <Chip className="bg-primary/10 text-primary border-primary/20 shrink-0 h-10 px-3">
                          Age: {new Date().getFullYear() - new Date(answers[q.id]).getFullYear()} years
                        </Chip>
                      )}
                      <p className="text-sm text-destructive">{localErrors[q.id]}</p>
                    </div>
                  )}
                  {q.type === "consent_checkbox" && <div className="flex flex-col gap-2"><div className={`flex items-start space-x-3  border p-4 ${localErrors[q.id] ? "border-destructive" : ""}`}><Checkbox id={q.id} checked={answers[q.id] === "true"} onCheckedChange={(c) => setAnswer(q.id, c ? "true" : "false")} /><div className="grid gap-1.5"><label htmlFor={q.id} className="text-sm leading-snug text-muted-foreground">{t.rich("consentHealth", { privacyLink: (chunks) => <Link href="/privacy" className="font-semibold text-primary hover:underline" target="_blank" rel="noopener noreferrer">{chunks}</Link> })}</label></div></div>{localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}</div>}
                  {q.type === "checkbox_group" && (
                    <>
                      <div className={localErrors[q.id] ? "border border-destructive  p-2" : ""}>
                        <CheckboxGroup options={q.options as CheckboxOption[]} value={answers[q.id] ? JSON.parse(answers[q.id]) : []} onChange={(s) => setAnswer(q.id, JSON.stringify(s))} exclusiveOption={q.exclusiveOptionId} idPrefix={q.id} answers={answers} />
                      </div>
                      {localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}
                    </>
                  )}
                  {q.type === "checkbox" && (
                    <div className="flex flex-col gap-2">
                      <div className={`flex items-start space-x-3 border p-4 ${localErrors[q.id] ? "border-destructive" : ""}`}>
                        <Checkbox
                          id={q.id}
                          checked={answers[q.id] === "true"}
                          onCheckedChange={(c) => setAnswer(q.id, c ? "true" : "false")}
                        />
                        <div className="grid gap-1.5">
                          <label
                            htmlFor={q.id}
                            className="text-sm leading-snug text-muted-foreground font-medium"
                          >
                            {/* For single checkboxes, we can use the main question text as the label */}
                            {q.text}
                          </label>
                          {/* If there's an internal label/description for the checkbox specifically, render it here too,
                               but q.text usually covers it for single checkboxes like "Use detailed calculator?" */}
                        </div>
                      </div>
                      {localErrors[q.id] && <p className="text-sm text-destructive">{localErrors[q.id]}</p>}
                    </div>
                  )}
                  {q.type === 'advanced_modules' && <Accordion type="multiple" className="w-full">{q.modules?.filter(m => isQuestionVisible(m, answers)).map(m => <AccordionItem value={m.id} key={m.id}><AccordionTrigger>{typeof m.title === 'string' ? m.title : (m.title[locale] || m.title.en)}</AccordionTrigger><AccordionContent>
                    {m.id === 'symptom_details' && <SymptomDetails selectedSymptoms={answers.symptoms ? questionnaire?.steps.flatMap(s => s.questions).find(q => q.id === 'symptoms')?.options?.filter((o: any) => JSON.parse(answers.symptoms).includes(o.id)) || [] : []} value={Object.keys(answers).reduce((acc, k) => { if (k.startsWith('symptom_details_')) { const sId = k.replace('symptom_details_', ''); acc[sId] = JSON.parse(answers[k]); } return acc; }, {} as Record<string, any>)} onChange={(sId, d) => setAnswer(`symptom_details_${sId}`, JSON.stringify(d))} symptomOptions={(symptomDetailsOptions?.symptomList || []).map((s: any) => ({ value: s.id, label: typeof s.label === 'object' ? s.label[locale] : s.label }))} featureOptions={(symptomDetailsOptions?.associatedFeatures || []).map((f: any) => ({ id: f.id, label: typeof f.label === 'object' ? f.label[locale] : f.label }))} errors={localErrors} />}
                    {m.id === 'family_cancer_history' && <FamilyCancerHistory value={answers.family_cancer_history ? JSON.parse(answers.family_cancer_history) : []} onChange={(v) => setAnswer('family_cancer_history', JSON.stringify(v))} options={m.options} errors={localErrors} />}
                    {m.id === 'genetics' && <Genetics answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'female_health' && <FemaleHealth answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'chronic_condition_details' && <GenericModule answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'personal_cancer_history' && <PersonalCancerHistory value={answers.personal_cancer_history ? JSON.parse(answers.personal_cancer_history) : []} onChange={(v) => setAnswer('personal_cancer_history', JSON.stringify(v))} options={m.options} errors={localErrors} />}
                    {m.id === 'screening_immunization' && <ScreeningHistory answers={answers} onAnswer={setAnswer} screeningGroups={m.screenings} immunizationQuestions={m.immunizations} questions={m.questions} errors={localErrors} />}
                    {m.id === 'medications_iatrogenic' && <Medications answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'sexual_health' && <SexualHealth answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'occupational_hazards' && <OccupationalHazards value={answers.occupational_hazards ? JSON.parse(answers.occupational_hazards) : []} onChange={(v) => setAnswer('occupational_hazards', JSON.stringify(v))} options={m.options} questions={m.questions} answers={answers} onAnswer={setAnswer} errors={localErrors} />}
                    {m.id === 'environmental_exposures' && <EnvironmentalExposures answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'labs_and_imaging' && <LabsAndImaging value={answers.labs_and_imaging ? JSON.parse(answers.labs_and_imaging) : []} onChange={(v) => setAnswer('labs_and_imaging', JSON.stringify(v))} options={m.options} errors={localErrors} />}
                    {m.id === 'functional_status' && <FunctionalStatus answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'physical_activity_details' && <GenericModule answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'smoking_details' && <SmokingDetails answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                    {m.id === 'prophylactic_surgery_details' && <GenericModule answers={answers} onAnswer={setAnswer} questions={m.questions} errors={localErrors} />}
                  </AccordionContent></AccordionItem>)}</Accordion>}

                  {q.infoCard && (
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mt-2">
                      <CardContent className="p-3 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {typeof q.infoCard.text === 'object' ? (q.infoCard.text as any)[locale] : q.infoCard.text}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </section>
            <footer className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="rounded-none">{t("back")}</Button>
              <Button variant="default" onClick={handleNext} className="rounded-none disabled:opacity-50">{currentStep === totalSteps - 1 ? t("viewResults") : t("next")}</Button>
            </footer>
          </div>
        </main>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white text-black md:hidden border-t"><DisclaimerFooterContentMobile /></footer>
    </div>
  );
}
