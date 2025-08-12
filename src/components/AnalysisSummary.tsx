import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreIndicatorProps {
  label: string;
  score: number;
}

const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ label, score }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{score.toFixed(0)}%</span>
    </div>
    <Progress value={score} />
  </div>
);

interface AnalysisSummaryProps {
  grammarScore: number;
  phrasingScore: number;
  vocabularyScore: number;
  overallSummary?: string;
}

export function AnalysisSummary({
  grammarScore,
  phrasingScore,
  vocabularyScore,
  overallSummary,
}: AnalysisSummaryProps) {
  return (
    <Card className="w-full lg:w-2/3 mx-auto">
      <CardHeader>
        <CardTitle>Key Takeaways</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {overallSummary && (
          <p className="text-center text-muted-foreground italic">
            "{overallSummary}"
          </p>
        )}
        <div className="space-y-3">
          <ScoreIndicator label="Grammar" score={grammarScore} />
          <ScoreIndicator label="Phrasing" score={phrasingScore} />
          <ScoreIndicator label="Vocabulary" score={vocabularyScore} />
        </div>
      </CardContent>
    </Card>
  );
}