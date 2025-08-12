import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { SrsItemType } from "@prisma/client";

const createFromTranslationSchema = z.object({
  frontContent: z.string().min(1),
  backContent: z.string().min(1),
  targetLanguage: z.string().min(1),
  explanation: z.string().optional(),
  type: z.nativeEnum(SrsItemType).optional(),
  mistakeId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    logger.info(
      `/api/srs/create-from-translation - POST - User: ${user.id}`,
      body,
    );

    const parsed = createFromTranslationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }

    const {
      frontContent,
      backContent,
      targetLanguage,
      explanation,
      type = SrsItemType.TRANSLATION,
      mistakeId,
    } = parsed.data;

    // Prevent creating duplicate cards
    const existingItem = await prisma.srsReviewItem.findFirst({
      where: {
        userId: user.id,
        frontContent: frontContent,
        type: type,
      },
    });

    if (existingItem) {
      logger.info(
        `SRS item already exists for user ${user.id} and frontContent "${frontContent}". Returning existing.`,
      );
      return NextResponse.json(existingItem);
    }

    const srsItem = await prisma.srsReviewItem.create({
      data: {
        userId: user.id,
        type: type,
        frontContent,
        backContent,
        context: explanation,
        targetLanguage,
        nextReviewAt: new Date(),
        mistakeId: mistakeId,
      },
    });

    return NextResponse.json(srsItem);
  } catch (error) {
    logger.error("/api/srs/create-from-translation failed", error);
    return NextResponse.json(
      { error: "Failed to create SRS item from translation" },
      { status: 500 },
    );
  }
}