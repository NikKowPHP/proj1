import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { sendAssessmentEmail } from "@/lib/services/email.service";
import type { AssessmentResult } from "@/lib/types";

const emailExportSchema = z.object({
  recipientEmail: z.string().email(),
  assessmentData: z.object({
    riskFactors: z.array(
      z.object({
        factor: z.string(),
        riskLevel: z.string(),
        explanation: z.string(),
      }),
    ),
    positiveFactors: z.array(
      z.object({
        factor: z.string(),
        explanation: z.string(),
      }),
    ),
    recommendations: z.array(z.string()),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = emailExportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { recipientEmail, assessmentData } = parsed.data;

    await sendAssessmentEmail(
      recipientEmail,
      assessmentData as AssessmentResult,
    );

    // IMPORTANT: We do not log the recipient's email to maintain anonymity.
    logger.info("Assessment email sent successfully.");

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in /api/export/email", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}