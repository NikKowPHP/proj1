import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authMiddleware(request);
    logger.info(`Admin user list requested by: ${user.id}`);
  } catch (error: any) {
    logger.error("Admin user list auth failed", error);
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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  try {
    const whereClause: Prisma.UserWhereInput = search
      ? {
          email: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const [users, totalCount] = await prisma.$transaction([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          createdAt: true,
          lastUsageReset: true,
        },
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: skip,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      users,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    logger.error("Failed to fetch users for admin", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
