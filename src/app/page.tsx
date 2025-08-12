import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileSignature,
  Sparkles,
  Repeat,
  BrainCircuit,
  BookText,
  Target,
  Lightbulb,
  GraduationCap,
  TrendingUp,
  BarChart3,
  PenSquare,
} from "lucide-react";

const PrincipleCard = ({
  icon: Icon,
  title,
  principle,
  description,
  featureName,
  featureLink,
}: {
  icon: React.ElementType;
  title: string;
  principle: string;
  description: string;
  featureName: string;
  featureLink: string;
}) => (
  <Card className="flex flex-col">
    <CardHeader>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Based on: {principle}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-1">
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
    <CardFooter>
      <Button asChild variant="secondary" className="w-full">
        <Link href={featureLink}>Explore the {featureName}</Link>
      </Button>
    </CardFooter>
  </Card>
);

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      {/* === SECTION 1: HERO === */}
      <section className="text-center py-20 px-4 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent pb-4">
            Master a Language by Writing
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop passively consuming and start actively creating. Get instant,
            AI-powered feedback on your journal entries and turn every mistake
            into a lesson.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">Start Writing for Free</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="#methodology">Learn How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* === SECTION 2: THE METHODOLOGY === */}
      <section id="methodology" className="py-20 px-4 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-background border rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Learning Science</span>
            </div>
            <h2 className="text-title-1">The Science of Fluency</h2>
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              Lexity is built on a foundation of proven learning principles to
              break you out of the "intermediate plateau" and build confident,
              active language skills.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <PrincipleCard
              icon={PenSquare}
              title="Active Production"
              principle="The Output Hypothesis (Swain)"
              description="Learning isn't just about input; it's about output. The very act of trying to produce language—forming sentences, searching for words—forces you to process it more deeply, revealing gaps in your knowledge and building fluency."
              featureName="Journal"
              featureLink="/journal"
            />
            <PrincipleCard
              icon={Lightbulb}
              title="Task-Centered Learning"
              principle="Merrill's Principles of Instruction"
              description="Learning is most effective when it's centered around real-world tasks, not abstract grammar rules. Every journal entry, summary, and practice drill in Lexity is a concrete task that activates your knowledge and makes it stick."
              featureName="Read & Write"
              featureLink="/read"
            />
            <PrincipleCard
              icon={Target}
              title="Targeted Feedback"
              principle="The Noticing Hypothesis (Schmidt)"
              description="You can't fix an error you aren't aware of. Our AI instantly highlights the specific differences between your writing and native phrasing. This act of 'noticing' is the critical first step toward correcting and mastering a concept."
              featureName="AI Analysis"
              featureLink="/journal"
            />
            <PrincipleCard
              icon={BrainCircuit}
              title="Smart Reinforcement"
              principle="Spaced Repetition & Interleaving"
              description="Your brain retains information better when reviews are spaced out over time. Our SRS algorithm schedules reviews of your personal mistakes at the optimal moment, just before you forget them, ensuring they move to long-term memory."
              featureName="Study Deck"
              featureLink="/study"
            />
            <PrincipleCard
              icon={TrendingUp}
              title="Targeted & Deliberate Practice"
              principle="Deliberate Practice (Anders Ericsson)"
              description="True improvement comes from focusing on your weaknesses. Lexity identifies your 'Challenging Concepts' and generates targeted drills, allowing you to practice the exact skills you need to improve."
              featureName="Practice Drills"
              featureLink="/study"
            />
            <PrincipleCard
              icon={BarChart3}
              title="Visual Feedback Loops"
              principle="Motivation & Goal-Setting Theory"
              description="Seeing your progress is a powerful motivator. Our dashboard provides detailed analytics on your proficiency and subskills over time, giving you a clear, visual representation of your growth and keeping you engaged."
              featureName="Analytics Dashboard"
              featureLink="/dashboard"
            />
          </div>
        </div>
      </section>

      {/* === SECTION 3: HOW IT WORKS === */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-title-1">Get Fluent in 3 Simple Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative">
            <div className="hidden md:block absolute top-8 left-0 w-full h-px">
              <svg
                width="100%"
                height="2"
                className="absolute top-1/2 -translate-y-1/2"
              >
                <line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  className="stroke-border"
                />
              </svg>
            </div>
            <div className="flex flex-col items-center relative z-10">
              <div className="text-4xl font-bold text-primary bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4 border-4 border-background">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Produce Language</h3>
              <p className="text-muted-foreground">
                Start a journal entry. Express your thoughts freely in your
                target language.
              </p>
            </div>
            <div className="flex flex-col items-center relative z-10">
              <div className="text-4xl font-bold text-primary bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4 border-4 border-background">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Perfect Your Skills</h3>
              <p className="text-muted-foreground">
                Receive instant, detailed feedback on your writing, from grammar
                to phrasing and vocabulary.
              </p>
            </div>
            <div className="flex flex-col items-center relative z-10">
              <div className="text-4xl font-bold text-primary bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-4 border-4 border-background">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Internalize Knowledge</h3>
              <p className="text-muted-foreground">
                Add corrections to your personalized study deck and review them
                intelligently over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === SECTION 4: FINAL CTA === */}
      <section className="bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center py-20 px-4">
          <h2 className="text-title-1">Ready to Achieve Fluency?</h2>
          <p className="text-muted-foreground mt-4 mb-8 max-w-2xl mx-auto">
            Transform your language learning through active writing practice.
            Start for free, no credit card required.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Sign Up and Start Writing</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}