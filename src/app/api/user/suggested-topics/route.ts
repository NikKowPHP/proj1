import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.id) {
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

  try {
    const topics = await prisma.suggestedTopic.findMany({
      where: {
        userId: authUser.id,
        targetLanguage: targetLanguage,
      },
      select: {
        title: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const topicTitles = topics.map((t) => t.title);

    return NextResponse.json({ topics: topicTitles });
  } catch (error) {
    logger.error("Error fetching suggested topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggested topics" },
      { status: 500 },
    );
  }
}
