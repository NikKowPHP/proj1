import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <section className="text-center py-20 px-4 sm:py-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent pb-4">
            Anonymous Health Risk Assessment
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Answer a few simple questions to receive an AI-powered assessment of
            potential health risks based on your lifestyle factors.
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg">
              <Link href="/assessment">Start My Anonymous Assessment</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto pb-20 px-4">
        <Card className="max-w-3xl mx-auto bg-secondary/30">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle>Important Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-center text-muted-foreground">
            <p>
              This tool provides information for educational purposes only and
              is not a substitute for professional medical advice, diagnosis, or
              treatment. The assessment is based on statistical data and cannot
              account for individual health conditions.
            </p>
            <p>
              <strong>
                Always consult with a qualified healthcare provider
              </strong>{" "}
              regarding any medical concerns or before making any decisions
              related to your health. We do not store any personally
              identifiable information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}