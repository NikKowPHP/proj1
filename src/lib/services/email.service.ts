import { Resend } from "resend";
import { logger } from "../logger";
import type { AssessmentResult } from "../types";

if (!process.env.RESEND_API_KEY) {
  logger.warn(
    "RESEND_API_KEY is not set. Email functionality will be disabled.",
  );
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function generateAssessmentHtml(assessmentData: AssessmentResult): string {
  const { overallSummary, modelAssessments, positiveFactors, recommendations } = assessmentData;

  const overallSummaryHtml = overallSummary ? `
    <h2 style="font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px;">Overall Summary</h2>
    <p style="font-size: 14px; margin-bottom: 16px;">${overallSummary}</p>
  ` : '';

  const modelAssessmentsHtml = modelAssessments
    .map(
      (model) => `
    <h2 style="font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px;">${model.modelName}</h2>
    ${model.riskFactors
      .map(
        (factor) => `
        <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="margin: 0 0 8px; font-size: 16px;">${factor.factor} (Risk: ${factor.riskLevel})</h3>
          <p style="margin: 0; font-size: 14px;">${factor.explanation}</p>
        </div>
      `,
      )
      .join("")}
  `,
    )
    .join("");

  const positiveFactorsHtml = positiveFactors
    .map(
      (factor) => `
    <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 8px;">
      <h3 style="margin: 0 0 8px; font-size: 16px;">${factor.factor}</h3>
      <p style="margin: 0; font-size: 14px;">${factor.explanation}</p>
    </div>
  `,
    )
    .join("");

  const recommendationsHtml = recommendations
    .map((rec) => `<li style="font-size: 14px; margin-bottom: 8px;">${rec}</li>`)
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style> body { font-family: sans-serif; color: #333; } .container { max-width: 600px; margin: auto; padding: 20px; } </style>
    </head>
    <body>
      <div class="container">
        <h1 style="font-size: 24px;">Your Anonymous Health Assessment Results</h1>
        <p>Thank you for using our tool. Here is a copy of your results. Please consider discussing them with a healthcare provider.</p>
        
        ${overallSummaryHtml}
        ${modelAssessmentsHtml}
        
        ${
          positiveFactors.length > 0
            ? `<h2 style="font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px;">Positive Lifestyle Factors</h2>${positiveFactorsHtml}`
            : ""
        }

        <h2 style="font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px;">Recommendations</h2>
        <ul>${recommendationsHtml}</ul>

        <hr style="margin: 32px 0;">
        <p style="font-size: 12px; color: #777;">
          <strong>Disclaimer:</strong> This information is for educational purposes only and is not a substitute for professional medical advice.
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function sendAssessmentEmail(
  recipientEmail: string,
  assessmentData: AssessmentResult,
) {
  if (!resend) {
    throw new Error("Email service is not configured.");
  }

  const emailHtml = generateAssessmentHtml(assessmentData);

  try {
    await resend.emails.send({
      from: "Assessment Tool <noreply@YOURDOMAIN.COM>", // Replace with your domain
      to: recipientEmail,
      subject: "Your Anonymous Health Assessment Results",
      html: emailHtml,
    });
  } catch (error) {
    logger.error("Failed to send assessment email via Resend", { error });
    throw new Error("Failed to send email.");
  }
}