"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useCreateCheckoutSession } from "@/lib/hooks/data";
import { tiers } from "@/lib/config/pricing";
import { Check } from "lucide-react";

export function PricingTable() {
  const router = useRouter();
  const checkoutMutation = useCreateCheckoutSession();

  const handleCheckout = (priceId: string) => {
    checkoutMutation.mutate(priceId, {
      onSuccess: (response) => {
        if (response.url) {
          window.location.href = response.url;
        }
      },
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map((tier) => (
        <Card key={tier.name} className="flex flex-col">
          <CardHeader>
            <CardTitle>{tier.name}</CardTitle>
            <CardDescription className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {tier.price}
              </span>
              {tier.price !== "$0" && (
                <span className="text-sm text-muted-foreground">/ month</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 mt-1 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => {
                if (tier.priceId) {
                  handleCheckout(tier.priceId);
                } else {
                  router.push("/signup");
                }
              }}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? "Processing..." : tier.cta}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}