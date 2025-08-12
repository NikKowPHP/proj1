import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FileSignature,
  Repeat,
  Sparkles,
  BookText,
  MessageSquareQuote,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileSignature,
    title: "AI-Powered Journaling",
    description:
      "The core of your learning. Write freely on any topic and receive instant, detailed feedback on your grammar, phrasing, and vocabulary.",
    link: "/journal",
    linkText: "Start Writing",
  },
  {
    icon: Repeat,
    title: "Spaced Repetition System (SRS)",
    description:
      "Turn your mistakes and new vocabulary into flashcards. Our smart system schedules reviews at the perfect time to build long-term memory.",
    link: "/study",
    linkText: "Go to Study Deck",
  },
  {
    icon: Sparkles,
    title: "Interactive Practice Drills",
    description:
      "Struggling with a concept? Dive into targeted exercises like fill-in-the-blanks and translations to master it.",
    link: "/study",
    linkText: "Practice a Mistake",
  },
  {
    icon: BookText,
    title: "Read & Write",
    description:
      "Improve your comprehension and production skills at the same time. Read a short text suited to your level, then write a summary to get feedback.",
    link: "/read",
    linkText: "Read a Passage",
  },
  {
    icon: MessageSquareQuote,
    title: "The Mistake Diary",
    description:
      "All your corrected mistakes are saved in one place. Review your learning history to see how far you've come and identify patterns.",
    link: "/study/mistakes",
    linkText: "Review Mistakes",
  },
  {
    icon: ImageIcon,
    title: "Structured Prompts",
    description:
      "Go beyond free writing with structured tasks like describing an image. Get feedback tailored to specific writing skills like descriptive language.",
    link: "/journal",
    linkText: "Try a Prompt",
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-secondary/30">
      <div className="container mx-auto py-12 px-4 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent pb-4">
            Our Learning Tools
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Lexity is more than just a journal. We've built a suite of connected
            tools designed to create a powerful, personalized learning loop.
          </p>
        </div>
      </div>

      <div className="container mx-auto pb-12 px-4 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col">
              <CardHeader className="flex-row items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={feature.link}>{feature.linkText}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}