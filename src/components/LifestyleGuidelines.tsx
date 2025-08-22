import React from "react";
import type { LifestyleGuideline } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { HeartPulse } from "lucide-react";

interface LifestyleGuidelinesProps {
  guidelines: LifestyleGuideline[];
}

export const LifestyleGuidelines = ({ guidelines }: LifestyleGuidelinesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-green-500" />
          Lifestyle Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {guidelines.map((guideline) => (
          <div key={guideline.id}>
            <p className="font-semibold">{guideline.title}</p>
            <p className="text-sm text-muted-foreground">
              {guideline.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
      