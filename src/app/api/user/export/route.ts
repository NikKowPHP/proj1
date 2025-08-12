
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = user.id;

  const [journalEntries, analyses] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.analysis.findMany({
      where: { entry: { authorId: userId } },
      include: { entry: true },
    }),
  ]);

  const exportData = {
    journalEntries,
    analyses,
  };

  return new NextResponse(JSON.stringify(exportData), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="lexity_export.json"',
    },
  });
};