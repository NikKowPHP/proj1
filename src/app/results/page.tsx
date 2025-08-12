"use client";

import { useEffect } from "react";
import { useAssessmentStore } from "@/lib/stores/assessment.store.ts";
import { useRiskAssessment } from "@/lib/hooks/data/useRiskAssessment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Spinner from "@/components/ui/Spinner";
import { AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResultsPage() {
  const { answers, reset } = useAssessmentStore();
  const {
    mutate: assess,
    data: assessment,
    isPending,
    isError,
    error,
  } = useRiskAssessment();

  useEffect(() => {
    // Only run the assessment if answers are present
    // This prevents re-running on component re-renders if data is already fetched
    if (Object.keys(answers).length > 0) {
      assess(answers);
    }
  }, [answers, assess]);

  if (Object.keys(answers).length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-2xl text-center space-y-4">
        <h1 className="text-2xl font-bold">No Assessment Data</h1>
        <p className="text-muted-foreground">
          It looks like you haven't completed an assessment yet.
        </p>
        <Button asChild>
          <Link href="/assessment">Start Assessment</Link>
        </Button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="text-center p-8 w-full max-w-md">
          <CardHeader>
            <CardTitle>Analyzing Your Results...</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">
              Please wait while our AI processes your information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="text-center p-8 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Analysis Failed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
              We couldn't process your results at this time.
            </p>
            <p className="text-xs text-muted-foreground">
              Error: {(error as Error).message}
            </p>
            <Button asChild variant="outline">
              <Link href="/assessment">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4">
      <div className="container mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Your Assessment Results</h1>
          <p className="text-muted-foreground mt-2">
            This is an educational summary. Please consult a healthcare
            provider.
          </p>
        </div>

        {assessment?.riskFactors.map((factor: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {factor.factor}
              </CardTitle>
              <CardDescription>
                Risk Level:{" "}
                <span className="font-semibold">{factor.riskLevel}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{factor.explanation}</p>
            </CardContent>
          </Card>
        ))}

        {assessment?.positiveFactors.map((factor: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {factor.factor}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{factor.explanation}</p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {assessment?.recommendations.map((rec: string, index: number) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <div className="text-center">
          <Button
            onClick={() => {
              reset();
              router.push("/");
            }}
          >
            Start New Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}