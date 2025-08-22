"use client";
import React from "react";
import type { ActionPlan } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ShieldCheck } from "lucide-react";
import { RecommendedScreenings } from "./RecommendedScreenings";
import { LifestyleGuidelines } from "./LifestyleGuidelines";
import { TopicsForDoctor } from "./TopicsForDoctor";
import { useTranslations } from "next-intl";

interface ActionPlanDisplayProps {
  plan: ActionPlan;
}

export const ActionPlanDisplay = ({ plan }: ActionPlanDisplayProps) => {
  const t = useTranslations("ResultsPage");

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            {t("overallSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{plan.overallSummary}</p>
        </CardContent>
      </Card>

      {plan.recommendedScreenings && plan.recommendedScreenings.length > 0 && (
        <RecommendedScreenings screenings={plan.recommendedScreenings} />
      )}

      {plan.lifestyleGuidelines && plan.lifestyleGuidelines.length > 0 && (
        <LifestyleGuidelines guidelines={plan.lifestyleGuidelines} />
      )}
      
      {plan.topicsForDoctor && plan.topicsForDoctor.length > 0 && (
        <TopicsForDoctor topics={plan.topicsForDoctor} />
      )}
    </div>
  );
};
      