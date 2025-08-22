import React from "react";
import type { TopicForDoctor } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MessageSquarePlus } from "lucide-react";

interface TopicsForDoctorProps {
  topics: TopicForDoctor[];
}

export const TopicsForDoctor = ({ topics }: TopicsForDoctorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-amber-500" />
          Topics to Discuss With Your Doctor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="list-disc pl-5 space-y-4">
          {topics.map((topic) => (
            <li key={topic.id} className="text-sm">
              <span className="font-semibold">{topic.title}</span>
              <p className="text-muted-foreground">{topic.why}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
      