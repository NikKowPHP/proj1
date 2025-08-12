"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useOnboardingStore, type OnboardingStep } from "@/lib/stores/onboarding.store";
import { CheckCircle, Circle, Loader, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

const CHECKLIST_DISMISSED_KEY = "onboarding_checklist_dismissed_v1";

const STEPS_CONFIG: { id: OnboardingStep; label: string }[] = [
  { id: "PROFILE_SETUP", label: "Set up your languages" },
  { id: "FIRST_JOURNAL", label: "Write your first journal entry" },
  { id: "VIEW_ANALYSIS", label: "Review your AI feedback" },
  { id: "CREATE_DECK", label: "Create your first flashcard" },
  { id: "STUDY_INTRO", label: "Complete your first study session" },
  { id: "READ_WRITE_INTRO", label: "Try the Read & Write mode" },
  { id: "DRILL_INTRO", label: "Practice concepts with a Quick Drill" },
];

const StepItem = ({
  label,
  status,
}: {
  label: string;
  status: "completed" | "current" | "pending";
}) => {
  const Icon =
    status === "completed"
      ? CheckCircle
      : status === "current"
      ? Loader
      : Circle;
  return (
    <li
      className={cn(
        "flex items-center gap-3 text-sm transition-colors",
        status === "completed" && "text-muted-foreground line-through",
        status === "current" && "font-semibold text-primary",
        status === "pending" && "text-muted-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          status === "current" && "animate-spin",
        )}
      />
      <span>{label}</span>
    </li>
  );
};

export function OnboardingChecklist() {
  const { step, isActive } = useOnboardingStore();
  const [isDismissed, setIsDismissed] = useState(true);
  const analytics = useAnalytics();

  useEffect(() => {
    const dismissed = localStorage.getItem(CHECKLIST_DISMISSED_KEY) === "true";
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
    setIsDismissed(true);
    analytics.capture("Onboarding Checklist Dismissed", { step_at_dismissal: step });
  };

  if (!isActive || isDismissed) {
    return null;
  }

  const currentStepIndex = STEPS_CONFIG.findIndex((s) => s.id === step);

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="w-80 shadow-2xl">
        <CardHeader className="flex-row items-center justify-between p-4">
          <CardTitle className="text-base">Getting Started</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss checklist</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ul className="space-y-2">
            {STEPS_CONFIG.map((s, index) => (
              <StepItem
                key={s.id}
                label={s.label}
                status={
                  index < currentStepIndex
                    ? "completed"
                    : index === currentStepIndex
                    ? "current"
                    : "pending"
                }
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}