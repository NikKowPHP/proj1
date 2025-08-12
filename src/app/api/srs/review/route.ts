import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { srsReviewRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";

const reviewSchema = z.object({
  srsItemId: z.string(),
  quality: z.number().min(0).max(5), // 0=Forgot, 3=Good, 5=Easy
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true },
    });

    // Apply rate limiting
    const limit = srsReviewRateLimiter(
      user.id,
      dbUser?.subscriptionTier || "FREE",
    );
    if (!limit.allowed) {
      logger.warn(
        `[API:srs/review] Internal SRS review rate limit exceeded for user: ${user.id}`,
      );
      return NextResponse.json(
        {
          error: "Daily review limit exceeded",
          code: "REVIEW_LIMIT_EXCEEDED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": limit.retryAfter!.toString(),
          },
        },
      );
    }

    const body = await req.json();
    logger.info(`/api/srs/review - POST - User: ${user.id}`, body);

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { srsItemId, quality } = parsed.data;

    // 1. Fetch the SRS item
    const item = await prisma.srsReviewItem.findFirst({
      where: {
        id: srsItemId,
        userId: user.id,
      },
    });

    if (!item)
      return NextResponse.json(
        { error: "SRS item not found" },
        { status: 404 },
      );

    // 2. Calculate new SRS parameters (simplified SM-2 algorithm)
    let newInterval: number;
    let newEaseFactor: number;
    const now = new Date();

    if (quality < 3) {
      // Incorrect response - reset interval but keep same ease factor
      newInterval = 1;
      newEaseFactor = item.easeFactor;
    } else {
      // Correct response - calculate new interval and ease factor
      // 1. First, calculate the new ease factor based on performance
      newEaseFactor =
        item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor

      // 2. Then, use the new ease factor to calculate the next interval
      if (item.interval === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(item.interval * newEaseFactor);
      }
    }

    // Calculate next review date
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

    // 3. Update the item
    const updatedItem = await prisma.srsReviewItem.update({
      where: { id: srsItemId },
      data: {
        interval: newInterval,
        easeFactor: newEaseFactor,
        nextReviewAt,
        lastReviewedAt: now,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    logger.error("/api/srs/review failed", error);
    return NextResponse.json(
      { error: "Failed to process review" },
      { status: 500 },
    );
  }
}