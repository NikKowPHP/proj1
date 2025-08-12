import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { decrypt } from "@/lib/encryption";

const MAX_DRILL_ITEMS = 15;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const targetLanguage = url.searchParams.get("targetLanguage");
    if (!targetLanguage) {
      return NextResponse.json(
        { error: "targetLanguage query parameter is required" },
        { status: 400 },
      );
    }

    const totalLearnedItems = await prisma.srsReviewItem.count({
      where: {
        userId: user.id,
        targetLanguage: targetLanguage,
        lastReviewedAt: { not: null }, // Only include items that have been reviewed at least once
      },
    });

    if (totalLearnedItems === 0) {
      return NextResponse.json([]); // No learned items to drill
    }

    // Fetch random learned items for the drill.
    // This is a simple random selection; for very large datasets,
    // a more optimized random sampling might be needed.
    const skip = Math.floor(Math.random() * Math.max(0, totalLearnedItems - MAX_DRILL_ITEMS));

    const drillItems = await prisma.srsReviewItem.findMany({
      where: {
        userId: user.id,
        targetLanguage: targetLanguage,
        lastReviewedAt: { not: null },
      },
      orderBy: { createdAt: "desc" }, // Order by creation to get a somewhat varied set, or could be random(order by 'id' OFFSET RANDOM())
      skip: skip,
      take: MAX_DRILL_ITEMS,
    });

    const decryptedItems = drillItems.map((item) => ({
      ...item,
      frontContent: decrypt(item.frontContent) || item.frontContent,
      backContent: decrypt(item.backContent) || item.backContent,
      context: decrypt(item.context) || item.context,
    }));

    return NextResponse.json(decryptedItems);
  } catch (error) {
    logger.error("Error fetching drill items:", error);
    return NextResponse.json(
      { error: "Failed to fetch drill items" },
      { status: 500 },
    );
  }
}