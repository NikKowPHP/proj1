"use client";

import { useEffect, useState } from "react";
import { useAssessmentStore } from "@/lib/stores/assessment.store.ts";
import { useRiskAssessment } from "@/lib/hooks/data/useRiskAssessment";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Spinner from "@/components/ui/Spinner";
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HeartPulse,
  Mail,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { generateAssessmentPdf } from "@/lib/utils/pdf-generator";
import type { AssessmentResult } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmailExport } from "@/lib/hooks/data/useEmailExport";
import { useRouter } from "next/navigation";

export default function ResultsPage() {
  const router = useRouter();
  const { answers, reset } = useAssessmentStore();
  const {
    mutate: assess,
    data: assessment,
    isPending,
    isError,
    error,
  } = useRiskAssessment();

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const emailExportMutation = useEmailExport();

  useEffect(() => {
    if (Object.keys(answers).length > 0 && !assessment) {
      assess(answers);
    }
  }, [answers, assess, assessment]);

  const handleEmailExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && assessment) {
      emailExportMutation.mutate(
        { recipientEmail: email, assessmentData: assessment },
        {
          onSuccess: () => {
            setIsEmailDialogOpen(false);
          },
        },
      );
    }
  };

  if (Object.keys(answers).length === 0 && !isPending && !assessment) {
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

        {assessment?.riskFactors.map((factor, index) => (
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

        {assessment?.positiveFactors.map((factor, index) => (
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
              {assessment?.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Conversation Starters for Your Doctor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>"Based on my lifestyle, what are the most important screenings for me at this age?"</li>
              <li>"I'd like to discuss my diet and activity levels. What's one change you'd recommend I focus on first?"</li>
              <li>"Are there any specific symptoms I should be aware of, given my risk factors?"</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               Helpful Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="list-disc pl-5 space-y-2 text-sm">
               <li><a href="https://www.cancer.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">National Cancer Institute (NCI)</a></li>
               <li><a href="https://www.cancer.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">American Cancer Society (ACS)</a></li>
             </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Your Results</CardTitle>
            <CardDescription>
              Save these results to discuss with a healthcare professional. We do not store this data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1" onClick={() => generateAssessmentPdf(assessment as AssessmentResult)}>
              <Download className="mr-2 h-4 w-4" />
              Download as PDF
            </Button>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Email My Results
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleEmailExport}>
                  <DialogHeader>
                    <DialogTitle>Email Your Results</DialogTitle>
                    <DialogDescription>
                      Enter your email address to receive a copy of your results. We will not store or use your email for any other purpose.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={emailExportMutation.isPending}>
                      {emailExportMutation.isPending && <Spinner size="sm" className="mr-2" />}
                      Send Email
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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