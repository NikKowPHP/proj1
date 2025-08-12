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

export const generateAssessmentPdf = (assessmentData: AssessmentResult) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // --- Header ---
  doc.setFontSize(18);
  doc.text("Your Anonymous Health Assessment Results", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(
    "Disclaimer: This is for educational purposes only. Consult a healthcare provider.",
    14,
    30,
  );

  let startY = 40;

  // --- Risk Factors per Model ---
  assessmentData.modelAssessments.forEach((model) => {
    if (model.riskFactors.length > 0) {
      doc.setFontSize(16);
      doc.text(model.modelName, 14, startY);
      startY += 10;

      doc.autoTable({
        startY,
        head: [["Factor", "Risk Level", "Explanation"]],
        body: model.riskFactors.map((f) => [
          f.factor,
          f.riskLevel,
          f.explanation,
        ]),
        theme: "striped",
        headStyles: { fillColor: [255, 193, 7] }, // Amber color for risks
      });
      startY = doc.autoTable.previous!.finalY + 15;
    }
  });


  // --- Positive Factors ---
  if (assessmentData.positiveFactors.length > 0) {
    doc.setFontSize(14);
    doc.text("Positive Lifestyle Factors", 14, startY);
    startY += 8;

    doc.autoTable({
      startY,
      head: [["Factor", "Details"]],
      body: assessmentData.positiveFactors.map((f) => [f.factor, f.explanation]),
      theme: "striped",
      headStyles: { fillColor: [76, 175, 80] }, // Green color for positives
    });
    startY = doc.autoTable.previous!.finalY + 10;
  }

  // --- Recommendations ---
  if (assessmentData.recommendations.length > 0) {
    doc.setFontSize(14);
    doc.text("Recommendations", 14, startY);
    startY += 8;

    const recommendationsText = assessmentData.recommendations
      .map((rec) => `- ${rec}`)
      .join("\n");
    doc.setFontSize(11);
    doc.text(recommendationsText, 14, startY, { maxWidth: 180 });
  }

  doc.save(`Health_Assessment_Results_${new Date().toLocaleDateString()}.pdf`);
};