import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import Spinner from "./ui/Spinner";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import Image from "next/image";

interface JournalEntry {
  id: string;
  title: string;
  snippet: string;
  date: string;
  isPending?: boolean;
  isMastered?: boolean;
  topic: {
    imageUrl?: string | null;
    type?: string | null;
  };
}

interface JournalHistoryListProps {
  journals: JournalEntry[];
}

export function JournalHistoryList({ journals }: JournalHistoryListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Previous Entries</h2>
      <div className="space-y-2 md:space-y-4">
        {journals.map((entry) => (
          <Link
            key={entry.id}
            href={!entry.isPending ? `/journal/${entry.id}` : "#"}
            passHref
            className={cn(entry.isPending && "pointer-events-none")}
            aria-disabled={entry.isPending}
            tabIndex={entry.isPending ? -1 : undefined}
          >
            <Card
              className={cn(
                "transition-colors cursor-pointer first:rounded-t-lg last:rounded-b-lg md:rounded-xl",
                entry.isPending
                  ? "opacity-60 bg-muted/50"
                  : "hover:bg-accent/50",
              )}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium line-clamp-1 flex items-center gap-2">
                    {entry.topic?.type === "IMAGE" && entry.topic?.imageUrl && (
                      <Image
                        src={entry.topic.imageUrl}
                        alt={entry.title}
                        width={24}
                        height={24}
                        className="rounded-sm object-cover"
                      />
                    )}
                    {entry.isMastered && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {entry.title}
                    {entry.isPending && <Spinner size="sm" />}
                  </h3>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {entry.date}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {entry.snippet}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}