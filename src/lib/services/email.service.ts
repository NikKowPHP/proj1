
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { logger } from "../logger";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ProgressReportData {
  journalEntries: number;
  newWords: number;
  mistakesCorrected: number;
  proficiencyChange: number;
}

export async function sendProgressReport(userId: string) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        languageProfiles: true, // Include the language profiles
      },
    });

    if (!user || !user.email) {
      logger.error(`User or user email not found for ID: ${userId}`);
      return;
    }

    if (!user.defaultTargetLanguage) {
      logger.info(
        `Skipping weekly report for user ${userId}: no default language set.`,
      );
      return;
    }

    const languageProfile = user.languageProfiles.find(
      (lp) => lp.language === user.defaultTargetLanguage,
    );

    const journalEntriesCount = await prisma.journalEntry.count({
      where: {
        authorId: userId,
        targetLanguage: user.defaultTargetLanguage,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const analysesLastWeek = await prisma.analysis.findMany({
      where: {
        entry: {
          authorId: userId,
          targetLanguage: user.defaultTargetLanguage,
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        mistakes: true,
      },
    });

    const mistakesCorrected = analysesLastWeek.reduce(
      (acc, analysis) => acc + analysis.mistakes.length,
      0,
    );

    // Note: The concepts of 'newWords' and 'proficiencyChange' are not in the current schema.
    const reportData = {
      journalEntries: journalEntriesCount,
      newWords: 0,
      mistakesCorrected,
      proficiencyChange: 0,
    };

    const proficiencyScoreHtml = languageProfile
      ? `<li>Current Proficiency Score: ${languageProfile.aiAssessedProficiency.toFixed(
          1,
        )}</li>`
      : "<li>Current Proficiency Score: Not yet calculated.</li>";

    const emailHtml = `
      <h1>Your Weekly Lexity Progress Report</h1>
      <p>Hello Language Learner,</p>
      <p>Here's your weekly progress summary for ${
        user.defaultTargetLanguage
      }:</p>
      <ul>
        <li>Journal entries: ${reportData.journalEntries}</li>
        <li>Mistakes corrected: ${reportData.mistakesCorrected}</li>
        ${proficiencyScoreHtml}
      </ul>
      <p>Keep up the great work!</p>
      <p>The Lexity Team</p>
    `;

    await resend.emails.send({
      from: "progress@lexity.app",
      to: user.email,
      subject: "Your Weekly Language Learning Progress Report",
      html: emailHtml,
    });

    logger.info(`Progress report sent to ${user.email}`);
  } catch (error) {
    logger.error("Error sending progress report:", error);
  }
}