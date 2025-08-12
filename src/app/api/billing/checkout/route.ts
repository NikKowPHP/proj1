import { NextResponse } from "next/server";
import { stripe } from "@/lib/services/stripe.service";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    logger.info(`/api/billing/checkout - POST - User: ${user.id}`, body);

    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true, email: true },
    });

    // Get or create customer in Stripe
    let customerId = dbUser?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          userId: user.id,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });

      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_API_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    logger.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
