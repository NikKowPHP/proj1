import { NextRequest, NextResponse } from "next/server";
import { ipRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { getAIService } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generatePlan } from "@/lib/services/guideline-engine.service";
import { StandardizationService } from "@/lib/services/standardization.service";
import { DerivedVariablesService } from "@/lib/services/derived-variables.service";

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

// Zod schema for the AI response to ensure type safety. Matches `ActionPlan`.
const recommendedScreeningSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  why: z.string(),
});

const lifestyleGuidelineSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

const topicForDoctorSchema = z.object({
  id: z.string(),
  title: z.string(),
  why: z.string(),
});

const aiResponseSchema = z.object({
  overallSummary: z.string(),
  recommendedScreenings: z.array(recommendedScreeningSchema),
  lifestyleGuidelines: z.array(lifestyleGuidelineSchema),
  topicsForDoctor: z.array(topicForDoctorSchema),
});

/**
 * A helper function to safely log assessment status to the database.
 * It catches errors during the DB operation and logs them to the console
 * without crashing the main API route.
 * @param status - The status to log (e.g., "SUCCESS", "SERVER_ERROR").
 */
async function logAssessmentStatus(status: string) {
  try {
    await prisma.assessmentLog.create({ data: { status } });
  } catch (error) {
    logger.error(`[API:assess] Failed to log status '${status}' to database.`, {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
    });
    // We don't rethrow, as a logging failure should not fail the main request.
  }
}

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

    // 1. Standardize the raw answers into a structured payload
    logger.info("[API:assess] Standardizing user answers...");
    const standardizedPayload = StandardizationService.standardize(validatedAnswers.data);
    logger.info("[API:assess] Standardization complete.");

    // 2. Calculate derived variables (e.g., BMI)
    logger.info("[API:assess] Calculating derived variables...");
    const derivedVariables = DerivedVariablesService.calculateAll(standardizedPayload);
    logger.info("[API:assess] Derived variables calculation complete.", { derivedVariables });
    
    // 3. Construct the final envelope for the AI
    const finalPayload = {
      standardized_data: standardizedPayload,
      derived_variables: derivedVariables,
    };
    
    // 4. Run deterministic guideline engine
    logger.info(`[API:assess] Starting guideline engine for locale: ${locale}...`);
    const guidelinePlan = generatePlan(
      validatedAnswers.data as Record<string, string>,
      locale,
    );
    logger.info(
      `[API:assess] Guideline engine completed. Found ${guidelinePlan.screenings.length} screenings, ${guidelinePlan.lifestyle.length} lifestyle tips, ${guidelinePlan.topicsForDoctor.length} topics.`,
    );

    // Attach deterministic plan to the final payload for the AI
    const payloadForAI = { ...finalPayload, guideline_plan: guidelinePlan };

    // 5. Get AI-powered explanation for the generated plan
    logger.info(`[API:assess] Requesting AI explanation in locale: ${locale}`);
    const aiService = getAIService();
    // Note: The `getPlanExplanation` now receives the full structured payload.
    // The prompt inside `getPreventivePlanExplainerPrompt` will need to be updated to handle this new structure.
    const { result, serviceUsed } =
      await aiService.getPlanExplanation(payloadForAI as any, undefined, locale);
    logger.info(
      `[API:assess] AI explanation received from service: ${serviceUsed}.`,
    );

    // 6. Validate the AI's explanation response
    logger.info("[API:assess] Validating AI response structure...");
    const validatedResult = aiResponseSchema.safeParse(result);
    if (!validatedResult.success) {
      logger.error("[API:assess] AI response validation failed", {
        error: validatedResult.error.flatten(),
        serviceUsed,
        aiResponse: result,
        guidelinePlan,
      });
      await logAssessmentStatus("AI_VALIDATION_ERROR");
      return NextResponse.json(
        { error: "Failed to process plan due to invalid AI response" },
        { status: 502 },
      );
    }
    logger.info("[API:assess] AI response validated successfully.");

    logger.info("[API:assess] Creating success log in database...");
    await logAssessmentStatus("SUCCESS");
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
    await logAssessmentStatus("SERVER_ERROR");
    return NextResponse.json(
      { error: "Failed to process plan" },
      { status: 500 },
    );
  }
}
