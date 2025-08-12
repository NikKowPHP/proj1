import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { user } = await authMiddleware(request);
    logger.info(`Admin settings requested by: ${user.id}`);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (error.message.includes("Admin access required")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert array to object for easier consumption on the client
    const settingsObj = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, any>,
    );

    return NextResponse.json(settingsObj);
  } catch (error) {
    logger.error("Failed to fetch system settings", error);
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await authMiddleware(request);
    logger.info(`Admin settings update by: ${user.id}`);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (error.message.includes("Admin access required")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 },
      );
    }

    const updatedSetting = await prisma.systemSetting.update({
      where: { key },
      data: { value },
    });

    return NextResponse.json(updatedSetting);
  } catch (error) {
    logger.error("Failed to update system setting", error);
    return NextResponse.json(
      { error: "Failed to update system setting" },
      { status: 500 },
    );
  }
}
