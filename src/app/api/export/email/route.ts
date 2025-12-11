import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { sendPlanEmail } from "@/lib/services/email.service";
import type { ActionPlan } from "@/lib/types";

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

const emailExportSchema = z.object({
  recipientEmail: z.string().email(),
  assessmentData: z.object({
    overallSummary: z.string(),
    recommendedScreenings: z.array(recommendedScreeningSchema),
    lifestyleGuidelines: z.array(lifestyleGuidelineSchema),
    topicsForDoctor: z.array(topicForDoctorSchema),
  }),
  answers: z.record(z.string(), z.string()),
  locale: z.string().optional().default("en"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = emailExportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { recipientEmail, assessmentData, answers, locale } = parsed.data;

    await sendPlanEmail(
      recipientEmail,
      assessmentData as ActionPlan,
      answers,
      locale,
    );

    // IMPORTANT: We do not log the recipient's email to maintain anonymity.
    logger.info("Plan email sent successfully.");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in /api/export/email", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
      