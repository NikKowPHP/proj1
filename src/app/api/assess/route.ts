import { NextRequest, NextResponse } from "next/server";
import { ipRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { getAIService } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateAllRisks } from "@/lib/services/risk-calculator.service";

const answersSchema = z
  .object({
    units: z.enum(["metric", "imperial"]),
    height: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Invalid height. Must be a positive number.",
    }),
    weight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Invalid weight. Must be a positive number.",
    }),
  })
  .catchall(z.string().optional());

// Zod schema for the AI response to ensure type safety remains the same
const riskFactorSchema = z.object({
  factor: z.string(),
  riskLevel: z.enum(["Low", "Moderate", "High"]),
  explanation: z.string(),
});

const modelAssessmentSchema = z.object({
  modelName: z.string(),
  riskFactors: z.array(riskFactorSchema),
});

const positiveFactorSchema = z.object({
  factor: z.string(),
  explanation: z.string(),
});

const aiResponseSchema = z.object({
  modelAssessments: z.array(modelAssessmentSchema),
  positiveFactors: z.array(positiveFactorSchema),
  recommendations: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";

  const limit = ipRateLimiter(ip);
  if (!limit.allowed) {
    logger.warn(`[API:assess] IP rate limit exceeded for: ${ip}`);
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsedAnswers = answersSchema.safeParse(body.answers);

    if (!parsedAnswers.success) {
      return NextResponse.json(
        { error: "Invalid answers format", details: parsedAnswers.error.flatten() },
        { status: 400 },
      );
    }

    // 1. Run deterministic calculation across all models
    const calculationResult = calculateAllRisks(parsedAnswers.data as Record<string, string>);

    // 2. Get AI-powered explanation for the calculation
    const aiService = getAIService();
    const { result, serviceUsed } =
      await aiService.getRiskAssessmentExplanation(calculationResult);

    // 3. Validate the AI's explanation response
    const validatedResult = aiResponseSchema.safeParse(result);
    if (!validatedResult.success) {
      logger.error("AI response validation failed", {
        error: validatedResult.error,
        serviceUsed,
        calculationResult, // Also log the deterministic result for debugging
      });
      await prisma.assessmentLog.create({
        data: { status: "AI_VALIDATION_ERROR" },
      });
      return NextResponse.json(
        { error: "Failed to process assessment due to invalid AI response" },
        { status: 502 },
      );
    }

    await prisma.assessmentLog.create({
      data: { status: "SUCCESS" },
    });

    return NextResponse.json(validatedResult.data);
  } catch (error) {
    logger.error("Error in /api/assess", error);
    await prisma.assessmentLog.create({
      data: { status: "SERVER_ERROR" },
    });
    return NextResponse.json(
      { error: "Failed to process assessment" },
      { status: 500 },
    );
  }
}