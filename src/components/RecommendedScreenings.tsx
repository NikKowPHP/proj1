import React from "react";
import type { RecommendedScreening } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Stethoscope } from "lucide-react";

interface RecommendedScreeningsProps {
  screenings: RecommendedScreening[];
}

export const RecommendedScreenings = ({
  screenings,
}: RecommendedScreeningsProps) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Recommended Screenings</h2>
      <div className="space-y-4">
        {screenings.map((screening) => (
          <Card key={screening.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                {screening.title}
              </CardTitle>
              <CardDescription>{screening.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">Why this is recommended:</p>
              <p className="text-sm text-muted-foreground">{screening.why}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
      