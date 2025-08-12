import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info(`/api/user - DELETE - User: ${user.id}`);

  try {
    // Mark user for deletion instead of hard deleting
    await prisma.user.update({
      where: { email: user.email },
      data: { status: "DELETION_PENDING" },
    });

    // Skip Supabase auth deletion - will be handled by a separate cleanup process
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete account", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
