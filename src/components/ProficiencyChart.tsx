
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "./ui/skeleton";

interface Point {
  date: string;
  score: number;
}

interface ChartDataPoint {
  date: string;
  score?: number;
  prediction?: number;
}

interface ProficiencyChartProps {
  data: Point[];
  predictionData?: Point[];
  timeRange?: '1y' | 'all';
  isLoading?: boolean;
}

const scoreToCefrLevel = (score: number) => {
  if (score <= 20) return "A1";
  if (score <= 40) return "A2";
  if (score <= 60) return "B1";
  if (score <= 80) return "B2";
  if (score <= 100) return "C1";
  return "";
};

const yAxisTicks = [0, 20, 40, 60, 80, 100];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload.find((p: any) => p.value !== undefined);
    if (!dataPoint) return null;

    const score = dataPoint.value;
    const level = scoreToCefrLevel(score);
    const date = new Date(label).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const isPrediction = dataPoint.dataKey === "prediction";

    return (
      <div className="p-2 bg-background border border-border rounded-lg shadow-lg">
        <p className="font-bold">{date}</p>
        <p className="text-sm text-muted-foreground">
          {isPrediction ? "Predicted Score: " : "Score: "}
          {score.toFixed(0)} ({level})
        </p>
      </div>
    );
  }
  return null;
};

export function ProficiencyChart({
  data,
  predictionData = [],
  timeRange = '1y',
  isLoading = false,
}: ProficiencyChartProps) {
  const combinedData: ChartDataPoint[] = [...data];

  if (predictionData.length > 0 && data.length > 0) {
    // Connect the prediction line to the last actual data point
    const lastActualPoint = data[data.length - 1];
    combinedData.push({ date: lastActualPoint.date, prediction: lastActualPoint.score });

    predictionData.forEach((p) => {
      combinedData.push({ date: p.date, prediction: p.score });
    });
  }

  const formatDate = (tickItem: string) => {
    const date = new Date(tickItem);
    const options: Intl.DateTimeFormatOptions =
      timeRange === 'all'
        ? { month: 'short', year: '2-digit' }
        : { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={combinedData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={{ stroke: "hsl(var(--foreground))" }}
            tickFormatter={formatDate}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={{ stroke: "hsl(var(--foreground))" }}
            domain={[0, 100]}
            ticks={yAxisTicks}
            tickFormatter={scoreToCefrLevel}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
          <Line
            type="monotone"
            dataKey="score"
            name="Proficiency"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-1))" }}
            connectNulls // This ensures the line doesn't break
          />
          {predictionData.length > 0 && (
            <Line
              type="monotone"
              dataKey="prediction"
              name="Prediction"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}