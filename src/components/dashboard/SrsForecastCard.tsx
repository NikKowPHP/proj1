"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { Calendar, BrainCircuit } from "lucide-react";

interface SrsForecastCardProps {
  dueCounts: {
    today: number;
    tomorrow: number;
    week: number;
  };
}

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center p-2 rounded-md">
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export function SrsForecastCard({ dueCounts }: SrsForecastCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Review Forecast
        </CardTitle>
        <CardDescription>
          Here's what your upcoming study schedule looks like.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 divide-x rounded-lg border bg-secondary/30">
          <StatItem label="Today" value={dueCounts.today} />
          <StatItem label="Tomorrow" value={dueCounts.tomorrow} />
          <StatItem label="This Week" value={dueCounts.week} />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/study">
            <BrainCircuit className="h-4 w-4 mr-2" />
            Start Studying
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}