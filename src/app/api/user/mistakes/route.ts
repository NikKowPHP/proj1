import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";

const schema = z.object({
  targetLanguage: z.string().min(1),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const validation = schema.safeParse(Object.fromEntries(searchParams));

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { targetLanguage, type, page, limit } = validation.data;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    analysis: {
      entry: {
        authorId: user.id,
        targetLanguage: targetLanguage,
      },
    },
  };

  if (type) {
    whereClause.type = type;
  }

  const [mistakes, totalCount] = await prisma.$transaction([
    prisma.mistake.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.mistake.count({ where: whereClause }),
  ]);

  const decryptedMistakes = mistakes.map((m) => ({
    ...m,
    originalText: decrypt(m.originalText),
    correctedText: decrypt(m.correctedText),
    explanation: decrypt(m.explanation),
  }));

  return NextResponse.json({
    mistakes: decryptedMistakes,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
  });
}