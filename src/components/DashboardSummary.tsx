import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardSummaryProps {
  totalEntries: number;
  averageScore: number;
  weakestSkill: string;
}

export function DashboardSummary({
  totalEntries,
  averageScore,
  weakestSkill,
}: DashboardSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalEntries}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Avg. Proficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{averageScore.toFixed(1)}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Focus Area</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold capitalize">{weakestSkill}</p>
        </CardContent>
      </Card>
    </div>
  );
}
