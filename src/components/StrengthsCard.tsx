import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";

interface StrengthsCardProps {
  text: string;
  explanation: string;
}

export function StrengthsCard({ text, explanation }: StrengthsCardProps) {
  return (
    <Card className="p-4 bg-secondary/50 border-green-500/30">
      <CardContent className="p-0 flex items-start gap-4">
        <div className="mt-1">
          <ThumbsUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            {text}
          </p>
          <p className="text-xs text-muted-foreground">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}