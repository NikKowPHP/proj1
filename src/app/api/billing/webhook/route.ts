import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/services/stripe.service";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  logger.info("/api/billing/webhook - POST - Received webhook");
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 },
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    logger.error("Webhook signature verification failed", err);
    return NextResponse.json(
      {
        error: `Webhook Error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      },
      { status: 400 },
    );
  }

  // Check if we've already processed this event
  const existingEvent = await prisma.processedWebhook.findUnique({
    where: { eventId: event.id },
  });
  if (existingEvent) {
    return NextResponse.json({ received: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.customer || !session.subscription) {
        logger.warn("Missing customer or subscription in checkout session", {
          session,
        });
        break;
      }

      try {
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        let tier = "FREE";
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          tier = "PRO";
        }

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionTier: tier,
            subscriptionStatus: "ACTIVE",
          },
        });
      } catch (err) {
        logger.error("Error handling checkout.session.completed:", err);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (!subscription.customer) {
        logger.warn("Missing customer in subscription update", {
          subscription,
        });
        break;
      }

      try {
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;

        let tier = "FREE";
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          tier = "PRO";
        }

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionTier: tier,
            subscriptionStatus: subscription.status.toUpperCase(),
          },
        });
      } catch (err) {
        logger.error("Error handling customer.subscription.updated:", err);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (!subscription.customer) {
        logger.warn("Missing customer in subscription delete", {
          subscription,
        });
        break;
      }
      try {
        const customerId = subscription.customer as string;
        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionTier: "FREE",
            subscriptionStatus: "CANCELED",
          },
        });
      } catch (err) {
        logger.error("Error handling customer.subscription.deleted:", err);
      }
      break;
    }
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  // Store the processed event ID
  await prisma.processedWebhook.create({
    data: {
      eventId: event.id,
      type: event.type,
      processedAt: new Date(),
    },
  });

  return NextResponse.json({ received: true });
}
