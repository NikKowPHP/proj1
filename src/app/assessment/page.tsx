"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessmentStore } from "@/lib/stores/assessment.store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    queryKey: ["questionnaire"],
    queryFn: apiClient.questionnaire.getActive,
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
    if (!value.trim()) return "This field is required.";
    const num = Number(value);
    if (isNaN(num)) return "Please enter a valid number.";
    if (num <= 0) return "Value must be positive.";
  
    if (id === 'height' && units === 'metric' && (num < 50 || num > 300)) return "Please enter a height between 50 and 300 cm.";
    if (id === 'height' && units === 'imperial' && (num < 20 || num > 120)) return "Please enter a height between 20 and 120 inches.";
    if (id === 'weight' && units === 'metric' && (num < 20 || num > 300)) return "Please enter a weight between 20 and 300 kg.";
    if (id === 'weight' && units === 'imperial' && (num < 40 || num > 660)) return "Please enter a weight between 40 and 660 lbs.";
    
    return null;
  };

  const handleInputChange = (id: string, value: string, type: Question['type']) => {
    let error: string | null = null;
    if (type === 'number_input') {
      error = validateNumberInput(id, value);
    }
    
    setLocalErrors(prev => ({ ...prev, [id]: error || '' }));
    
    // Always set the answer to allow `isStepComplete` to react, but rely on `localErrors` for validation state.
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
          Error loading assessment: {(error as Error).message}
        </p>
      </div>
    );
  }

  const stepData = questionnaire?.steps[currentStep];
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const visibleQuestions = stepData?.questions.filter(q => {
    if (!q.dependsOn) return true;
    return answers[q.dependsOn.questionId] === q.dependsOn.value;
  }) || [];
  
  const isStepComplete = () => {
    if (!questionnaire) return false;
    
    const allAnswered = visibleQuestions.every(q => answers[q.id] && answers[q.id].trim() !== "");
    const noErrors = visibleQuestions.every(q => !localErrors[q.id]);

    return allAnswered && noErrors;
  };

  const hasHeightOrWeight = stepData?.questions.some(q => q.id === 'height' || q.id === 'weight');

  return (
    <>
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Resume Session?</DialogTitle>
            <DialogDescription>
              It looks like you have a session in progress. Would you like to
              resume or start a new assessment?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStartNew}>
              Start New
            </Button>
            <Button onClick={() => setShowResumeDialog(false)}>Resume</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Progress value={progressPercentage} className="mb-4" />
            <CardTitle>{stepData?.title}</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {totalSteps}
              {stepData?.description && <span className="block mt-2">{stepData.description}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && hasHeightOrWeight && (
              <div className="space-y-2">
                <Label>Units</Label>
                <Tabs value={units} onValueChange={(value) => setUnits(value as 'metric' | 'imperial')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="metric">Metric (cm / kg)</TabsTrigger>
                    <TabsTrigger value="imperial">Imperial (inches / lbs)</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            {visibleQuestions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id}>{question.text}</Label>
                {question.type === 'select' && (
                  <Select
                    onValueChange={(value) => setAnswer(question.id, value)}
                    value={answers[question.id] || ""}
                  >
                    <SelectTrigger id={question.id}>
                      <SelectValue placeholder="Select an option" />
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
                {question.type === 'number_input' && (
                  <>
                    <Input
                      id={question.id}
                      type="number"
                      inputMode="decimal"
                      placeholder={
                        question.id === 'height'
                          ? (units === 'metric' ? 'e.g., 175' : 'e.g., 69')
                          : (units === 'metric' ? 'e.g., 70' : 'e.g., 154')
                      }
                      value={answers[question.id] || ""}
                      onChange={(e) => handleInputChange(question.id, e.target.value, question.type)}
                      aria-invalid={!!localErrors[question.id]}
                      className={localErrors[question.id] ? "border-destructive" : ""}
                    />
                    {localErrors[question.id] && <p className="text-sm text-destructive">{localErrors[question.id]}</p>}
                  </>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button onClick={handleNext} disabled={!isStepComplete()}>
              {currentStep === totalSteps - 1 ? "View Results" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}