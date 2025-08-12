import { PricingTable } from "@/components/PricingTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "What's included in the early adopter offer?",
    answer:
      "You get all the features of our Pro plan, completely free, forever. This includes unlimited AI analyses, unlimited SRS reviews, advanced analytics, and all future Pro features. No credit card is required.",
  },
  {
    question: "What happens when the early adopter period ends?",
    answer:
      "Your account will retain its Pro status for free, forever. New users who sign up after the offer ends will need to subscribe to a paid plan to access Pro features.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "For paid plans, you can cancel your subscription at any time from your account settings. For early adopters, there's nothing to cancel as your Pro access is free.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, including Visa, Mastercard, and American Express, processed securely through Stripe.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-secondary/30">
      {/* Hero Section */}
      <section className="text-center py-12 px-4 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent pb-4">
            Find the Perfect Plan
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that best fits your language learning goals. Start
            for free and upgrade anytime.
          </p>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto pb-12 px-4 sm:pb-20 space-y-12">
        {/* Early Adopter Offer */}
        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 p-6 text-center">
          <CardHeader className="p-0">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-title-1">
                Early Adopter Offer: Free Pro, Forever!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
              As a thank you for being one of our first users, we're giving you
              the Pro plan for free, forever. Just sign up and start learning.
              This is a limited-time offer for our foundational community.
            </p>
            <Button asChild size="lg">
              <Link href="/signup">Claim Your Free Pro Account</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pricing Table */}
        <PricingTable />

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-title-1 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="flex items-start gap-4">
                <HelpCircle className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <p className="text-muted-foreground mt-1">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}