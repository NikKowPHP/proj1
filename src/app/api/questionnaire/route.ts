import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const activeQuestionnaire = await prisma.questionnaire.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });

    if (!activeQuestionnaire) {
      return NextResponse.json(
        { error: "No active questionnaire found" },
        { status: 404 },
      );
    }

    return NextResponse.json(activeQuestionnaire.content);
  } catch (error) {
    logger.error("Error fetching questionnaire", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaire" },
      { status: 500 },
    );
  }
}