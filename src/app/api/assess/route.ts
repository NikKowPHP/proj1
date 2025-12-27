import { NextRequest, NextResponse } from "next/server";
import { ipRateLimiter } from "@/lib/rateLimiter";
import { logger } from "@/lib/logger";
import { getAIService } from "@/lib/ai";
import { z } from "zod";
import { generatePlan } from "@/lib/services/guideline-engine.service";
import { StandardizationService } from "@/lib/services/standardization.service";
import { DerivedVariablesService } from "@/lib/services/derived-variables.service";
import { FhirMapperService } from "@/lib/services/fhir-mapper.service";

// A flexible schema to accept the complex, potentially nested data from the new form.
// Detailed validation is handled by the standardization and derived variable services.
const answersSchema = z.record(z.string(), z.any());

const assessRequestSchema = z.object({
  answers: answersSchema,
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

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";
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
    
    // Explicit Consent Check
    if (answers['consent.health'] !== 'true' && answers['consent.health'] !== true) {
      logger.warn("[API:assess] Request rejected due to missing health consent.");
      return NextResponse.json(
        { error: "Health data processing consent is required." },
        { status: 403 }
      );
    }

    logger.info("[API:assess] Raw answers successfully parsed.");

    // 1. Standardize the raw answers into a structured payload
    logger.info("[API:assess] Standardizing user answers...");
    const standardizedPayload = StandardizationService.standardize(answers);
    logger.info("[API:assess] Standardization complete.");

    // 2. Calculate derived variables (e.g., BMI, age_years)
    logger.info("[API:assess] Calculating derived variables...");
    const derivedVariables = DerivedVariablesService.calculateAll(standardizedPayload);
    logger.info("[API:assess] Derived variables calculation complete.", { derivedVariables });
    
    // 3. Run deterministic guideline engine
    logger.info(`[API:assess] Starting guideline engine for locale: ${locale}...`);
    const guidelinePlan = generatePlan(answers, derivedVariables, locale);
    logger.info(
      `[API:assess] Guideline engine completed. Found ${guidelinePlan.screenings.length} screenings, ${guidelinePlan.lifestyle.length} lifestyle tips, ${guidelinePlan.topicsForDoctor.length} topics.`,
    );

    // 4. Generate FHIR Bundle for interoperability
    logger.info("[API:assess] Generating FHIR R4 Bundle...");
    const fhirBundle = FhirMapperService.toFhirBundle(answers, standardizedPayload, derivedVariables);
    logger.info(`[API:assess] FHIR Bundle generated with ${fhirBundle.entry.length} resources.`);

    // 5. Construct the final envelope for the AI
    const payloadForAI = {
      standardized_data: standardizedPayload,
      derived_variables: derivedVariables,
      guideline_plan: guidelinePlan,
      fhir_data: fhirBundle,
    };

    // 6. Get AI-powered explanation for the generated plan
    logger.info(`[API:assess] Requesting AI explanation in locale: ${locale}`);
    const aiService = getAIService();
    const { result, serviceUsed } =
      await aiService.getPlanExplanation(payloadForAI, undefined, locale);
    logger.info(
      `[API:assess] AI explanation received from service: ${serviceUsed}.`,
    );

    // 7. Validate the AI's explanation response
    logger.info("[API:assess] Validating AI response structure...");
    const validatedResult = aiResponseSchema.safeParse(result);
    if (!validatedResult.success) {
      logger.error("[API:assess] AI response validation failed", {
        error: validatedResult.error.flatten(),
        serviceUsed,
        aiResponse: result,
        guidelinePlan,
      });
      return NextResponse.json(
        { error: "Failed to process plan due to invalid AI response" },
        { status: 502 },
      );
    }
    logger.info("[API:assess] AI response validated successfully.");

    logger.info("[API:assess] Assessment processed successfully.");

    logger.info("[API:assess] Sending successful response to client.");
    return NextResponse.json(validatedResult.data);
  } catch (error) {
    logger.error("[API:assess] An unhandled error occurred.", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
    });
    return NextResponse.json(
      { error: "Failed to process plan" },
      { status: 500 },
    );
  }
}
      