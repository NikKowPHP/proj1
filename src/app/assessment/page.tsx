"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessmentStore } from "@/lib/stores/assessment.store.ts";
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

interface Question {
  id: string;
  text: string;
  type: "select";
  options: string[];
}

interface Step {
  title: string;
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
  } = useAssessmentStore();

  const [isClient, setIsClient] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // We get the store state directly inside the effect to avoid stale closures
    // and only show the dialog if there are answers from a previous session.
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
      router.push("/results");
    }
  };

  const handleStartNew = () => {
    reset();
    setShowResumeDialog(false);
  };

  const isStepComplete = () => {
    if (!questionnaire) return false;
    const currentQuestions = questionnaire.steps[currentStep].questions;
    return currentQuestions.every((q) => answers[q.id]);
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
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {stepData?.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label>{question.text}</Label>
                <Select
                  onValueChange={(value) => setAnswer(question.id, value)}
                  value={answers[question.id] || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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