"use client";

import React from "react";
import { useEffect, useState, useRef } from "react";
import { useAssessmentStore } from "@/lib/stores/assessment.store";
import { useRiskAssessment } from "@/lib/hooks/data/useRiskAssessment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Spinner from "@/components/ui/Spinner";
import { Mail, Download, ArrowLeft } from "lucide-react";
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
import { AppHeaderContent } from "@/components/AppHeaderContent";
import { DisclaimerFooterContent } from "@/components/DisclaimerFooterContent";
import { DisclaimerFooterContentMobile } from "@/components/DisclaimerFooterContentMobile";

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

  const { answers, reset, units } = useAssessmentStore();
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
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEmailDialogOpen) {
      // Radix dialog animation is ~300ms. User wants 1s delay after.
      const focusTimeout = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 500); // 300ms animation + 1000ms delay

      return () => clearTimeout(focusTimeout);
    }
  }, [isEmailDialogOpen]);

  useEffect(() => {
    if (Object.keys(answers).length > 0 && !assessment) {
      assess({ answers, locale, units });
    }
  }, [answers, assess, assessment, locale, units]);

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

  let content: React.ReactNode;

  if (Object.keys(answers).length === 0 && !isPending && !assessment) {
    content = (
      <div className="container mx-auto p-4 max-w-2xl text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("noDataTitle")}</h1>
        <p className="text-muted-foreground">{t("noDataDescription")}</p>
        <Button asChild>
          <Link href="/assessment">{t("noDataCta")}</Link>
        </Button>
      </div>
    );
  } else if (isPending) {
    content = (
      <div className="flex flex-col items-center justify-center p-4 h-full">
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
  } else if (isError) {
    content = (
      <div className="flex flex-col items-center justify-center p-4 h-full">
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
  } else {
    content = (
      <div className="container mx-auto max-w-3xl space-y-8 py-12 px-4">
        <Button
          variant="ghost"
          className="pl-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToHome")}
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("resultsTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("resultsDescription")}</p>
        </div>

        {assessment && <ActionPlanDisplay plan={assessment} />}

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{t("exportTitle")}</CardTitle>
            <CardDescription>{t("exportDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row p-0 gap-4 sm:gap-0">
            <Button
              onClick={handleDownloadPdf}
              className="rounded-none py-4 px-6 text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("exportPdf")}
            </Button>
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-none border-t border-white/10 py-10 sm:py-4 px-6 mx-4 text-base hover:bg-white/5 sm:border-t-0 sm:border-l"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t("exportEmail")}
                </Button>
              </DialogTrigger>
              <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <form onSubmit={handleEmailExport}>
                  <DialogHeader>
                    <DialogTitle>{t("emailDialogTitle")}</DialogTitle>
                    <DialogDescription>{t("emailDialogDescription")}</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input ref={emailInputRef} id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
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
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile-Only Header (White Background) */}
      <header className="p-4 bg-white text-black md:hidden">
        <AppHeaderContent />
      </header>

      {/* Main Container: Becomes a grid on desktop, is a flex container on mobile */}
      <div className="flex-grow flex md:grid md:grid-cols-2">
        {/* Left Column (Desktop-Only, White Background) */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-white text-black">
          <AppHeaderContent />
          <DisclaimerFooterContent />
        </div>

        {/* Right Column / Main Content (Black Background) */}
        <main className="bg-black text-white w-full flex flex-col flex-grow items-center justify-center p-4 pb-24 md:p-4">
          {content}
        </main>
      </div>

      {/* Mobile-Only Footer (White Background) */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 p-4 bg-white text-black md:hidden border-t">
        <DisclaimerFooterContentMobile />
      </footer>
    </div>
  );
}
