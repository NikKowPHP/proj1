"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateUserGoals } from "@/lib/hooks/data/useUpdateUserGoals";
import type { UserGoals } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

interface GoalSettingProps {
  goals?: UserGoals | null;
  isLoading: boolean;
}

export function GoalSetting({ goals, isLoading }: GoalSettingProps) {
  const [weeklyJournals, setWeeklyJournals] = useState<number | string>("");
  const { mutate: updateGoals, isPending } = useUpdateUserGoals();

  useEffect(() => {
    if (goals?.weeklyJournals) {
      setWeeklyJournals(goals.weeklyJournals);
    }
  }, [goals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const journalGoal =
      typeof weeklyJournals === "number"
        ? weeklyJournals
        : parseInt(String(weeklyJournals), 10);
    if (!isNaN(journalGoal) && journalGoal > 0) {
      updateGoals({ weeklyJournals: journalGoal });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2 self-end" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekly-journals">Weekly Journal Entries</Label>
            <Input
              id="weekly-journals"
              type="number"
              min="1"
              max="20"
              value={weeklyJournals}
              onChange={(e) => setWeeklyJournals(e.target.value)}
              placeholder="e.g., 3"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Goal"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}