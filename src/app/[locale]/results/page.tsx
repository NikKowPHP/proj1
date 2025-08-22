"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useAssessmentStore } from "@/lib/stores/assessment.store";
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
import { Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { generateAssessmentPdf } from "@/lib/utils/pdf-generator";
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
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ActionPlanDisplay } from "@/components/ActionPlanDisplay";

const loadingMessagesKeys = [
  "loadingMessage1",
  "loadingMessage2",
  "loadingMessage3",
];

export default function ResultsPage() {
  const t = useTranslations("ResultsPage");
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";

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
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    if (Object.keys(answers).length > 0 && !assessment) {
      assess({ answers, locale });
    }
  }, [answers, assess, assessment, locale]);

  useEffect(() => {
    if (isPending) {
      setLoadingMessageIndex(0);
      const timers: NodeJS.Timeout[] = [];

      timers.push(
        setTimeout(() => {
          setLoadingMessageIndex(1);
        }, 10000),
      );

      timers.push(
        setTimeout(() => {
          setLoadingMessageIndex(2);
        }, 20000),
      );

      return () => {
        timers.forEach(clearTimeout);
      };
    }
  }, [isPending]);

  const handleEmailExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && assessment) {
      emailExportMutation.mutate(
        {
          recipientEmail: email,
          assessmentData: assessment,
          answers,
          locale,
        },
        {
          onSuccess: () => {
            setIsEmailDialogOpen(false);
          },
        },
      );
    }
  };

  const handleDownloadPdf = () => {
    if (assessment) {
      generateAssessmentPdf(assessment, answers, locale);
    }
  };


  if (Object.keys(answers).length === 0 && !isPending && !assessment) {
    return (
      <div className="container mx-auto p-4 max-w-2xl text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("noDataTitle")}</h1>
        <p className="text-muted-foreground">{t("noDataDescription")}</p>
        <Button asChild>
          <Link href="/assessment">{t("noDataCta")}</Link>
        </Button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="text-center p-8 w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("loadingTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-muted-foreground">
              {t(loadingMessagesKeys[loadingMessageIndex])}
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
            <CardTitle className="text-destructive">{t("errorTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">{t("errorDescription")}</p>
            <p className="text-xs text-muted-foreground">
              Error: {(error as Error).message}
            </p>
            <Button asChild variant="outline">
              <Link href="/assessment">{t("errorCta")}</Link>
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
          <h1 className="text-3xl font-bold">{t("resultsTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("resultsDescription")}</p>
        </div>
        
        {assessment && <ActionPlanDisplay plan={assessment} />}

        <Card>
          <CardHeader>
            <CardTitle>{t("exportTitle")}</CardTitle>
            <CardDescription>{t("exportDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="flex-1" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              {t("exportPdf")}
            </Button>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  {t("exportEmail")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleEmailExport}>
                  <DialogHeader>
                    <DialogTitle>{t("emailDialogTitle")}</DialogTitle>
                    <DialogDescription>{t("emailDialogDescription")}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={emailExportMutation.isPending}>
                      {emailExportMutation.isPending && <Spinner size="sm" className="mr-2" />}
                      {t("emailDialogCta")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => {
              reset();
              router.push("/");
            }}
          >
            {t("newAssessment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
      