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

const assessRequestSchema = z.object({
  answers: z.record(z.string()),
  locale: z.string().optional().default("en"),
});

// Zod schema for the AI response to ensure type safety
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
  overallSummary: z.string(),
  modelAssessments: z.array(modelAssessmentSchema),
  positiveFactors: z.array(positiveFactorSchema),
  recommendations: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /) : "127.0.0.1";
  logger.info(`[API:assess] Request received from IP: ${ip}`);

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
    logger.info("[API:assess] Request body parsed.");
    const parsedRequest = assessRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      logger.warn("[API:assess] Invalid request format.", {
        details: parsedRequest.error.flatten(),
      });
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: parsedRequest.error.flatten(),
        },
        { status: 400 },
      );
    }
    
    const { answers, locale } = parsedRequest.data;
    
    const validatedAnswers = answersSchema.safeParse(answers);
    if (!validatedAnswers.success) {
      logger.warn("[API:assess] Invalid answers format.", {
        details: validatedAnswers.error.flatten(),
      });
      return NextResponse.json(
        {
          error: "Invalid answers format",
          details: validatedAnswers.error.flatten(),
        },
        { status: 400 },
      );
    }


    logger.info("[API:assess] Answers successfully parsed and validated.");

    // 1. Run deterministic calculation across all models
    logger.info(`[API:assess] Starting deterministic risk calculation for locale: ${locale}...`);
    const calculationResult = calculateAllRisks(
      validatedAnswers.data as Record<string, string>,
      locale,
    );
    logger.info(
      `[API:assess] Deterministic risk calculation completed for models: ${calculationResult.modelResults.map((m) => m.modelId).join(", ")}`,
    );

    // 2. Get AI-powered explanation for the calculation
    logger.info(`[API:assess] Requesting AI explanation in locale: ${locale}`);
    const aiService = getAIService();
    const { result, serviceUsed } =
      await aiService.getRiskAssessmentExplanation(calculationResult, undefined, locale);
    logger.info(
      `[API:assess] AI explanation received from service: ${serviceUsed}.`,
    );

    // 3. Validate the AI's explanation response
    logger.info("[API:assess] Validating AI response structure...");
    const validatedResult = aiResponseSchema.safeParse(result);
    if (!validatedResult.success) {
      logger.error("[API:assess] AI response validation failed", {
        error: validatedResult.error.flatten(),
        serviceUsed,
        aiResponse: result,
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
    logger.info("[API:assess] AI response validated successfully.");

    logger.info("[API:assess] Creating success log in database...");
    await prisma.assessmentLog.create({
      data: { status: "SUCCESS" },
    });
    logger.info("[API:assess] Success log created.");

    logger.info("[API:assess] Sending successful response to client.");
    return NextResponse.json(validatedResult.data);
  } catch (error) {
    logger.error("[API:assess] An unhandled error occurred.", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
    });
    await prisma.assessmentLog.create({
      data: { status: "SERVER_ERROR" },
    });
    return NextResponse.json(
      { error: "Failed to process assessment" },
      { status: 500 },
    );
  }
}
