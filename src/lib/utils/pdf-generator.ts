import jsPDF from "jspdf";
import "jspdf-autotable";
import type { AssessmentResult } from "../types";

// Extend jsPDF with autoTable, including its static `previous` property
// which is used to get the y-position of the last drawn table.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: {
    (options: any): jsPDF;
    previous?: { finalY: number };
  };
}

const translations: Record<string, any> = {
  en: {
    title: "Your Anonymous Health Assessment Results",
    disclaimer: "Disclaimer: This is for educational purposes only. Consult a healthcare provider.",
    overallSummary: "Overall Summary",
    riskFactorsHead: ["Factor", "Risk Level", "Explanation"],
    positiveFactors: "Positive Lifestyle Factors",
    positiveFactorsHead: ["Factor", "Details"],
    recommendations: "Recommendations",
    filename: "Health_Assessment_Results",
  },
  pl: {
    title: "Twoje Wyniki Anonimowej Oceny Zdrowia",
    disclaimer: "Zastrzeżenie: To jest tylko w celach edukacyjnych. Skonsultuj się z lekarzem.",
    overallSummary: "Ogólne Podsumowanie",
    riskFactorsHead: ["Czynnik", "Poziom Ryzyka", "Wyjaśnienie"],
    positiveFactors: "Pozytywne Czynniki Stylu Życia",
    positiveFactorsHead: ["Czynnik", "Szczegóły"],
    recommendations: "Rekomendacje",
    filename: "Wyniki_Oceny_Zdrowia",
  }
}

export const generateAssessmentPdf = (assessmentData: AssessmentResult, locale: string = 'en') => {
  const t = translations[locale] || translations.en;
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // --- Header ---
  doc.setFontSize(18);
  doc.text(t.title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(t.disclaimer, 14, 30);

  let startY = 40;

  // --- Overall Summary ---
  if (assessmentData.overallSummary) {
    doc.setFontSize(14);
    doc.text(t.overallSummary, 14, startY);
    startY += 8;
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(assessmentData.overallSummary, 180);
    doc.text(summaryLines, 14, startY);
    startY += summaryLines.length * 5 + 10;
  }

  // --- Risk Factors per Model ---
  assessmentData.modelAssessments.forEach((model) => {
    if (model.riskFactors.length > 0) {
      doc.setFontSize(16);
      doc.text(model.modelName, 14, startY);
      startY += 10;

      doc.autoTable({
        startY,
        head: [t.riskFactorsHead],
        body: model.riskFactors.map((f) => [
          f.factor,
          f.riskLevel,
          f.explanation,
        ]),
        theme: "striped",
        headStyles: { fillColor: [245, 158, 11] }, // Amber color for risks
      });
      startY = doc.autoTable.previous!.finalY + 15;
    }
  });


  // --- Positive Factors ---
  if (assessmentData.positiveFactors.length > 0) {
    doc.setFontSize(14);
    doc.text(t.positiveFactors, 14, startY);
    startY += 8;

    doc.autoTable({
      startY,
      head: [t.positiveFactorsHead],
      body: assessmentData.positiveFactors.map((f) => [f.factor, f.explanation]),
      theme: "striped",
      headStyles: { fillColor: [34, 197, 94] }, // Green color for positives
    });
    startY = doc.autoTable.previous!.finalY + 10;
  }

  // --- Recommendations ---
  if (assessmentData.recommendations.length > 0) {
    doc.setFontSize(14);
    doc.text(t.recommendations, 14, startY);
    startY += 8;

    const recommendationsText = assessmentData.recommendations
      .map((rec) => `- ${rec}`)
      .join("\n");
    doc.setFontSize(11);
    doc.text(recommendationsText, 14, startY, { maxWidth: 180 });
  }

  doc.save(`${t.filename}_${new Date().toLocaleDateString()}.pdf`);
};
      