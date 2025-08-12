
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const targetLanguage = url.searchParams.get("targetLanguage");
  const includeAll = url.searchParams.get("includeAll") === 'true';
  
  if (!targetLanguage)
    return NextResponse.json(
      { error: "targetLanguage is required" },
      { status: 400 },
    );

  const now = new Date();

  const whereClause: Prisma.SrsReviewItemWhereInput = {
    userId: user.id,
    targetLanguage: targetLanguage,
  };

  if (!includeAll) {
    whereClause.nextReviewAt = {
      lte: now,
    };
  }

  const srsItems = await prisma.srsReviewItem.findMany({
    where: whereClause,
    include: {
      mistake: true,
    },
    orderBy: {
      nextReviewAt: "asc",
    },
    take: includeAll ? undefined : 30, // No limit when fetching all
  });

  return NextResponse.json(srsItems);
}