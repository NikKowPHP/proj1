import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./ui/skeleton";

interface SuggestedTopicsProps {
  topics: string[];
  isLoading?: boolean;
}

export function SuggestedTopics({ topics, isLoading }: SuggestedTopicsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suggested Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {topics.map((topic) => (
            <Link
              key={topic}
              href={`/journal?topic=${encodeURIComponent(topic)}`}
              passHref
            >
              <Button
                variant="outline"
                className="w-full h-auto md:w-full md:h-auto p-4 text-left justify-start whitespace-normal rounded-md"
              >
                {topic}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}