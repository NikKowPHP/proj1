import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "../ui/button";

export interface Concept {
  mistakeId: string;
  averageScore: number | null;
  attempts: number;
  explanation: string;
  originalText: string;
  correctedText: string;
}

interface ChallengingConceptsCardProps {
  concepts: Concept[];
  isLoading: boolean;
  onPractice: (concept: Concept) => void;
}

const ConceptItem = ({
  concept,
  onPractice,
}: {
  concept: Concept;
  onPractice: (concept: Concept) => void;
}) => (
  <div className="space-y-3">
    <p className="text-sm text-muted-foreground italic line-clamp-2">
      "{concept.explanation}"
    </p>
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>Avg. Score: {concept.averageScore?.toFixed(0) ?? "N/A"}%</span>
      <span>{concept.attempts} attempts</span>
    </div>
    <Progress value={concept.averageScore ?? 0} className="h-2" />
    <div className="text-right">
      <Button
        variant="secondary"
        size="sm"
        className="h-8"
        onClick={() => onPractice(concept)}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Practice Now
      </Button>
    </div>
  </div>
);

export const ChallengingConceptsCard = ({
  concepts,
  isLoading,
  onPractice,
}: ChallengingConceptsCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Concepts to Review</CardTitle>
          <CardDescription>
            Based on your practice performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!concepts || concepts.length === 0) {
    return null; // Don't render the card if there's nothing to show
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Concepts to Review
        </CardTitle>
        <CardDescription>
          Based on your recent practice performance. Keep it up!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {concepts.map((concept) => (
          <ConceptItem
            key={concept.mistakeId}
            concept={concept}
            onPractice={onPractice}
          />
        ))}
      </CardContent>
    </Card>
  );
};