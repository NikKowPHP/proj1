import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="bg-secondary/30">
      <div className="container mx-auto py-12 px-4 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent pb-4">
            Our Story
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            We're a small team from Poland, united by a shared passion for
            languages and technology. We built Lexity because it's the
            tool we always wished we had.
          </p>
        </div>
      </div>

      <div className="container mx-auto pb-12 px-4 sm:pb-20">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-title-1 text-center">
              From Frustration to Fluency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-body prose prose-lg max-w-none dark:prose-invert">
            <p>
              Lexity was born out of a simple, yet profound realization:
              traditional language learning often feels passive. We spent years
              consuming textbooks, flashcard apps, and video lessons, but when
              it came to actually *producing* the language—writing an email,
              sharing a story, or expressing a complex thought—we felt stuck.
              The bridge between knowing a word and using it confidently seemed
              impossibly long.
            </p>
            <p>
              As an experienced polyglot and developer, our founder knew there
              had to be a better way. The key wasn't just more consumption, but
              more *creation* with a tight, intelligent feedback loop. What if,
              instead of just being told the right answer, you could get
              feedback on your own sentences, in your own words?
            </p>
            <p>
              Joined by a talented designer who shared this vision, we set out
              to create a new kind of learning experience. One that empowers
              learners to be active participants in their own journey. We
              leveraged the power of modern AI not as a gimmick, but as a
              dedicated, personal tutor that's available 24/7.
            </p>
            <blockquote className="border-l-4 border-primary pl-4 italic">
              "Our mission is to help you find your own voice in a new language.
              We believe that true mastery comes from practice, expression, and
              the confidence to make mistakes."
            </blockquote>
            <p>
              We are just getting started. Every feature, from the AI-powered
              journaling to the spaced-repetition system, is designed to help
              you close the gap between passive knowledge and active fluency.
              Thank you for being part of our journey.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
