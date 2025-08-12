
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

interface SubskillPoint {
  date: string;
  grammar: number;
  phrasing: number;
  vocabulary: number;
}

interface SubskillChartDataPoint {
  date: string;
  grammar?: number;
  phrasing?: number;
  vocabulary?: number;
  predictedGrammar?: number;
  predictedPhrasing?: number;
  predictedVocabulary?: number;
}

interface SubskillProgressChartProps {
  data: SubskillPoint[];
  predictionData?: SubskillPoint[];
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
    const date = new Date(label).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="p-2 bg-background border border-border rounded-lg shadow-lg">
        <p className="font-bold">{date}</p>
        <ul className="text-sm">
          {payload.map((p: any) => {
            if (p.value === undefined) return null;
            return (
              <li key={p.dataKey} style={{ color: p.color }}>
                {p.name}: {p.value.toFixed(0)} ({scoreToCefrLevel(p.value)})
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return null;
};

export function SubskillProgressChart({
  data,
  predictionData = [],
  timeRange = '1y',
  isLoading = false,
}: SubskillProgressChartProps) {
  const combinedData: SubskillChartDataPoint[] = [...data];

  if (predictionData.length > 0 && data.length > 0) {
    const lastActualPoint = data[data.length - 1];
    combinedData.push({
      date: lastActualPoint.date,
      predictedGrammar: lastActualPoint.grammar,
      predictedPhrasing: lastActualPoint.phrasing,
      predictedVocabulary: lastActualPoint.vocabulary,
    });

    predictionData.forEach((p) => {
      combinedData.push({
        date: p.date,
        predictedGrammar: p.grammar,
        predictedPhrasing: p.phrasing,
        predictedVocabulary: p.vocabulary,
      });
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
            dataKey="grammar"
            name="Grammar"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="phrasing"
            name="Phrasing"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="vocabulary"
            name="Vocabulary"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
            connectNulls
          />

          {predictionData.length > 0 && (
            <>
              <Line
                type="monotone"
                dataKey="predictedGrammar"
                name="Grammar (Pred.)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="predictedPhrasing"
                name="Phrasing (Pred.)"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="predictedVocabulary"
                name="Vocabulary (Pred.)"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}