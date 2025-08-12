import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SubskillScoresProps {
  data: Array<{
    skill: string;
    score: number;
  }>;
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
    const score = payload[0].value;
    const level = scoreToCefrLevel(score);
    return (
      <div className="p-2 bg-background border border-border rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-sm text-muted-foreground">
          Score: {score.toFixed(0)} ({level})
        </p>
      </div>
    );
  }
  return null;
};

export function SubskillScores({ data }: SubskillScoresProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="skill"
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={{ stroke: "hsl(var(--foreground))" }}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickLine={{ stroke: "hsl(var(--foreground))" }}
            domain={[0, 100]}
            ticks={yAxisTicks}
            tickFormatter={scoreToCefrLevel}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--accent))" }}
            content={<CustomTooltip />}
          />
          <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
          <Bar
            dataKey="score"
            fill="hsl(var(--chart-1))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}