import { Resend } from "resend";
import { logger } from "../logger";
import type { ActionPlan } from "../types";

if (!process.env.RESEND_API_KEY) {
  logger.warn(
    "RESEND_API_KEY is not set. Email functionality will be disabled.",
  );
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const translations: Record<string, any> = {
  en: {
    subject: "Your Proactive Health Plan",
    title: "Doctor's Discussion Guide",
    intro:
      "Thank you for using our tool. Here is a copy of your personalized preventive health plan. Please consider discussing it with a healthcare provider.",
    overallSummary: "Overall Summary",
    recommendedScreenings: "Recommended Screenings",
    lifestyleGuidelines: "Lifestyle Guidelines",
    topicsForDoctor: "Topics for Your Doctor",
    yourAnswers: "Your Provided Answers",
    disclaimer:
      "This information is for educational purposes only and is not a substitute for professional medical advice.",
  },
  pl: {
    subject: "Twój Proaktywny Plan Zdrowia",
    title: "Przewodnik do Dyskusji z Lekarzem",
    intro:
      "Dziękujemy za skorzystanie z naszego narzędzia. Oto kopia Twojego spersonalizowanego planu profilaktyki zdrowotnej. Rozważ omówienie go z lekarzem.",
    overallSummary: "Ogólne Podsumowanie",
    recommendedScreenings: "Zalecane Badania Przesiewowe",
    lifestyleGuidelines: "Wskazówki Dotyczące Stylu Życia",
    topicsForDoctor: "Tematy do Omówienia z Lekarzem",
    yourAnswers: "Twoje Udzielone Odpowiedzi",
    disclaimer:
      "Te informacje służą wyłącznie celom edukacyjnym i nie zastępują profesjonalnej porady medycznej.",
  },
};

function generateAssessmentHtml(
  planData: ActionPlan,
  answers: Record<string, string>,
  locale: string,
): string {
  const t = translations[locale] || translations.en;
  const {
    overallSummary,
    recommendedScreenings,
    lifestyleGuidelines,
    topicsForDoctor,
  } = planData;

  const sectionStyle = "margin-bottom: 24px;";
  const h2Style = "font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 24px; color: #333;";
  const h3Style = "margin: 0 0 8px; font-size: 16px; color: #444;";
  const pStyle = "margin: 0; font-size: 14px; color: #555; line-height: 1.6;";
  const listItemStyle = "font-size: 14px; margin-bottom: 8px;";

  const createSection = (title: string, content: string) => content ? `<div style="${sectionStyle}"><h2 style="${h2Style}">${title}</h2>${content}</div>` : "";

  const summaryHtml = createSection(t.overallSummary, `<p style="${pStyle}">${overallSummary}</p>`);
  
  const screeningsHtml = createSection(
    t.recommendedScreenings,
    recommendedScreenings.map(s => `
        <div style="margin-bottom: 16px;">
            <h3 style="${h3Style}">${s.title}</h3>
            <p style="${pStyle}">${s.description}</p>
            <p style="${pStyle}"><strong>Why it's recommended:</strong> ${s.why}</p>
        </div>
    `).join("")
  );

  const lifestyleHtml = createSection(
    t.lifestyleGuidelines,
    lifestyleGuidelines.map(g => `
      <div style="margin-bottom: 16px;">
          <h3 style="${h3Style}">${g.title}</h3>
          <p style="${pStyle}">${g.description}</p>
      </div>
    `).join("")
  );
  
  const topicsHtml = createSection(
    t.topicsForDoctor,
    `<ul>${topicsForDoctor.map(topic => `<li style="${listItemStyle}"><strong>${topic.title}:</strong> ${topic.why}</li>`).join("")}</ul>`
  );
  
  const answersHtml = createSection(
    t.yourAnswers,
    `<ul>${Object.entries(answers).map(([key, value]) => `<li style="${listItemStyle}"><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</li>`).join("")}</ul>`
  );


  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style> body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; } .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; } </style>
    </head>
    <body>
      <div class="container">
        <h1 style="font-size: 24px; color: #111;">${t.title}</h1>
        <p>${t.intro}</p>
        
        ${summaryHtml}
        ${screeningsHtml}
        ${lifestyleHtml}
        ${topicsHtml}
        ${answersHtml}

        <hr style="margin: 32px 0;">
        <p style="font-size: 12px; color: #777;">
          <strong>Disclaimer:</strong> ${t.disclaimer}
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function sendAssessmentEmail(
  recipientEmail: string,
  assessmentData: ActionPlan,
  answers: Record<string, string>,
  locale: string,
) {
  if (!resend) {
    throw new Error("Email service is not configured.");
  }

  const t = translations[locale] || translations.en;
  const emailHtml = generateAssessmentHtml(assessmentData, answers, locale);

  try {
    await resend.emails.send({
      from: "Health Planner <noreply@YOURDOMAIN.COM>", // Replace with your domain
      to: recipientEmail,
      subject: t.subject,
      html: emailHtml,
    });
  } catch (error) {
    logger.error("Failed to send assessment email via Resend", { error });
    throw new Error("Failed to send email.");
  }
}
      