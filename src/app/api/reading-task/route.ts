import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIService } from "@/lib/ai";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type { ReadingLevel } from "@/lib/types";
import { tieredRateLimiter } from "@/lib/rateLimiter";
import { prisma } from "@/lib/db";

// Zod schema for the request body
const readingTaskRequestSchema = z.object({
  content: z.string().min(1),
  targetLanguage: z.string().min(1),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

// Zod schema for the AI response
const taskObjectSchema = z.object({
  title: z.string(),
  prompt: z.string(),
});
const readingTaskResponseSchema = z.object({
  summary: taskObjectSchema,
  comprehension: taskObjectSchema,
  creative: taskObjectSchema,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Rate Limiting
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionTier: true },
    });
    const rateLimitResult = tieredRateLimiter(
      user.id,
      dbUser?.subscriptionTier || "FREE",
    );
    if (!rateLimitResult.allowed) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const body = await req.json();
    const parsedRequest = readingTaskRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const { content, targetLanguage, level } = parsedRequest.data;

    const aiService = getAIService();
    // Call the new service method
    const { result } = await aiService.generateReadingTasks(
      content,
      targetLanguage,
      level as ReadingLevel,
      user.id,
    );

    // Validate the AI response against the Zod schema
    const parsedResult = readingTaskResponseSchema.safeParse(result);
    if (!parsedResult.success) {
      logger.error("[API:reading-task] AI response validation failed.", {
        error: parsedResult.error,
        response: result,
      });
      return new NextResponse("Internal Server Error: AI response malformed", {
        status: 502, // Bad Gateway as per plan
      });
    }

    return NextResponse.json(parsedResult.data);
  } catch (error) {
    logger.error("[API:reading-task] An unexpected error occurred.", { error });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}