import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info(`/api/user/reset-onboarding - POST - User: ${user.id}`);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error resetting onboarding:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 },
    );
  }
}