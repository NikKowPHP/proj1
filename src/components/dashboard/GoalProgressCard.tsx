"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserGoals } from "@/lib/types";
import Link from "next/link";
import { Button } from "../ui/button";

interface GoalProgressCardProps {
  goals?: UserGoals | null;
  journalsThisWeek: number;
}

export function GoalProgressCard({
  goals,
  journalsThisWeek,
}: GoalProgressCardProps) {
  const weeklyJournalGoal = goals?.weeklyJournals ?? 0;

  if (weeklyJournalGoal === 0) {
    return (
      <Card>
        <div className="p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-headline font-semibold">Set Your Goals</h3>
            <p className="text-sm text-muted-foreground">
              Stay motivated by setting weekly learning goals.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/settings">Set Goals</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const progress = Math.min(
    100,
    (journalsThisWeek / weeklyJournalGoal) * 100,
  );
  const isGoalMet = journalsThisWeek >= weeklyJournalGoal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Goal Progress</CardTitle>
        <CardDescription>
          {isGoalMet
            ? "Great job! You've met your weekly goal."
            : `You're on your way to writing ${weeklyJournalGoal} journal entries this week.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-2xl font-bold">{journalsThisWeek}</span>
          <span className="text-muted-foreground">/ {weeklyJournalGoal} entries</span>
        </div>
        <Progress value={progress} />
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/journal">Write a New Entry</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}