import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const goalsSchema = z.object({
  weeklyJournals: z.number().int().min(1).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    logger.info(`/api/user/goals - PUT - User: ${user.id}`, body);

    const parsed = goalsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        goals: parsed.data,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to update user goals", error);
    return NextResponse.json(
      { error: "Failed to update goals" },
      { status: 500 },
    );
  }
}