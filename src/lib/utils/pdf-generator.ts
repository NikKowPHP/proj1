import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ActionPlan } from "../types";
import { onkonoLogoBase64 } from "../assets/onkono-logo-base64";

// --- Task 2: Prepare and Embed Logo Asset ---
// NOTE: Replace this placeholder with the actual Base64 encoded logo from /onkono-logo.png
const LOGO_BASE64 = onkonoLogoBase64;


interface jsPDFWithAutoTable extends jsPDF {
  autoTable: {
    (options: any): jsPDF;
    previous?: { finalY: number };
  };
}

// --- Task 1: Define Brand Color Constants ---
const THEME = {
  BRAND_COLOR: "#FF3B30",
  TEXT_COLOR: "#333333",
  HEADER_TEXT_COLOR: "#FFFFFF",
};

const translations: Record<string, any> = {
  en: {
    title: "Doctor's Discussion Guide",
    disclaimer:
      "This is a guide for discussion with a healthcare professional and is not medical advice.",
    overallSummary: "Overall Summary",
    recommendedScreenings: "Recommended Screenings",
    lifestyleGuidelines: "Lifestyle Guidelines",
    topicsForDoctor: "Topics For Your Doctor",
    yourAnswers: "Your Provided Answers",
    filename: "Doctors_Discussion_Guide",
  },
  pl: {
    title: "Przewodnik do Dyskusji z Lekarzem",
    disclaimer:
      "To jest przewodnik do dyskusji z pracownikiem służby zdrowia i nie stanowi porady medycznej.",
    overallSummary: "Ogólne Podsumowanie",
    recommendedScreenings: "Zalecane Badania Przesiewowe",
    lifestyleGuidelines: "Wskazówki Dotyczące Stylu Życia",
    topicsForDoctor: "Tematy do Omówienia z Lekarzem",
    yourAnswers: "Twoje Udzielone Odpowiedzi",
    filename: "Przewodnik_Do_Dyskusji_Z_Lekarzem",
  },
};

// --- Task 5: Create a Custom `drawSectionHeader` Function ---
const drawSectionHeader = (doc: jsPDFWithAutoTable, title: string, startY: number): number => {
  const headerHeight = 10;
  const padding = 14;

  doc.setFillColor(THEME.BRAND_COLOR);
  doc.rect(padding, startY, doc.internal.pageSize.getWidth() - (padding * 2), headerHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(THEME.HEADER_TEXT_COLOR);
  doc.text(title, padding + 3, startY + headerHeight / 2 + 2);

  // Return the Y position for the content below the header
  return startY + headerHeight + 4;
};


export const generateAssessmentPdf = (
  planData: ActionPlan,
  answers: Record<string, string>,
  locale: string = "en",
) => {
  const t = translations[locale] || translations.en;
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageMargin = 14;

  // --- Task 4: Standardize Document Font ---
  doc.setFont("helvetica", "normal");
  doc.setTextColor(THEME.TEXT_COLOR);

  // --- Task 3: Implement Logo Rendering ---
  doc.addImage(LOGO_BASE64, "PNG", pageMargin, 15, 60, 10);

  // --- Header ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(t.title, pageMargin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(t.disclaimer, pageMargin, 48);

  let startY = 60;

  // --- Overall Summary ---
  if (planData.overallSummary) {
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(planData.overallSummary, doc.internal.pageSize.getWidth() - (pageMargin * 2));
    doc.text(summaryLines, pageMargin, startY);
    startY += summaryLines.length * 5 + 10;
  }
  
  const checkPageBreak = (currentY: number) => {
    if (currentY > 260) { // Check if space is running out
      doc.addPage();
      return 20; // Start Y on new page
    }
    return currentY;
  };

  // --- Recommended Screenings ---
  if (planData.recommendedScreenings.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.recommendedScreenings, startY);
    doc.autoTable({
      startY,
      body: planData.recommendedScreenings.map((s) => [s.title, s.why]),
      // --- Task 7: Remove Default Headers ---
      showHead: false,
      // --- Task 8: Unify and Simplify Table Styles ---
      theme: "plain",
      styles: {
        cellPadding: { top: 3, right: 3, bottom: 3, left: 1 },
        font: "helvetica",
        fontSize: 10,
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      margin: { left: pageMargin },
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 10;
  }

  // --- Lifestyle Guidelines ---
  if (planData.lifestyleGuidelines.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.lifestyleGuidelines, startY);
    doc.autoTable({
      startY,
      body: planData.lifestyleGuidelines.map((l) => [l.title, l.description]),
      showHead: false,
      theme: "plain",
      styles: {
        cellPadding: { top: 3, right: 3, bottom: 3, left: 1 },
        font: "helvetica",
        fontSize: 10,
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      margin: { left: pageMargin },
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 10;
  }

  // --- Topics For Your Doctor ---
  if (planData.topicsForDoctor.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.topicsForDoctor, startY);
    doc.autoTable({
      startY,
      body: planData.topicsForDoctor.map((topic) => [topic.title, topic.why]),
      showHead: false,
      theme: "plain",
      styles: {
        cellPadding: { top: 3, right: 3, bottom: 3, left: 1 },
        font: "helvetica",
        fontSize: 10,
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      margin: { left: pageMargin },
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 10;
  }

  // --- Your Provided Answers ---
  if (Object.keys(answers).length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.yourAnswers, startY);
    doc.autoTable({
      startY,
      body: Object.entries(answers).map(([key, value]) => [
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
      ]),
      showHead: false,
      theme: "plain",
      styles: {
        cellPadding: { top: 3, right: 3, bottom: 3, left: 1 },
        font: "helvetica",
        fontSize: 10,
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      margin: { left: pageMargin },
    });
  }

  doc.save(
    `${t.filename}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
  );
};
      