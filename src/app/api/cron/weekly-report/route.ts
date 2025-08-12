import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendProgressReport } from "@/lib/services/email.service";

export async function POST(req: Request) {
  // Verify the request is from our cron job
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    const results = await Promise.allSettled(
      users.map((user) => sendProgressReport(user.id)),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const errors = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      message: "Weekly reports processing completed",
      successful,
      errors,
    });
  } catch (error) {
    console.error("Error processing weekly reports:", error);
    return NextResponse.json(
      { error: "Failed to process weekly reports" },
      { status: 500 },
    );
  }
}
