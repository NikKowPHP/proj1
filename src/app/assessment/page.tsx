"use client";
import React, { useEffect } from "react";
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
  } = useAssessmentStore();

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

  const isStepComplete = () => {
    if (!questionnaire) return false;
    const currentQuestions = questionnaire.steps[currentStep].questions;
    return currentQuestions.every((q) => answers[q.id]);
  };

  if (isLoading) {
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
  );
}