import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authMiddleware } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/logger";

const subscriptionSchema = z.object({
  subscriptionTier: z.enum(["FREE", "PRO", "ADMIN"]),
  subscriptionStatus: z.enum(["ACTIVE", "CANCELED", "PAUSED"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate and authorize
    const { id } = await params;
    if (!id) {
      return new NextResponse("User ID is required", { status: 400 });
    }
    const { user } = await authMiddleware(req);
    logger.info(
      `/api/admin/users/${id}/subscription - PUT - Admin: ${user.id}`,
    );

    const body = await req.json();
    const parsed = subscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return new NextResponse("Invalid subscription data", { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        subscriptionTier: parsed.data.subscriptionTier,
        subscriptionStatus: parsed.data.subscriptionStatus || "ACTIVE",
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    const { id } = await params;
    logger.error(`Error in /api/admin/users/${id}/subscription PUT`, error);
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (error.message.includes("Admin access required")) {
      return new NextResponse("Forbidden - Admin access required", {
        status: 403,
      });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
