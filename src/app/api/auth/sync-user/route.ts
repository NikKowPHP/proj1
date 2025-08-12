import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserInDb } from "@/lib/user";
import { logger } from "@/lib/logger";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info(`Syncing user: ${user.id}`);
    const dbUser = await ensureUserInDb(user);
    return NextResponse.json({ success: true, userId: dbUser.id });
  } catch (error) {
    logger.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user profile" },
      { status: 500 },
    );
  }
}
