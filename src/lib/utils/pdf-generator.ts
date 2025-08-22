import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ActionPlan } from "../types";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: {
    (options: any): jsPDF;
    previous?: { finalY: number };
  };
}

const translations: Record<string, any> = {
  en: {
    title: "Doctor's Discussion Guide",
    disclaimer:
      "This is a guide for discussion with a healthcare professional and is not medical advice.",
    overallSummary: "Overall Summary",
    recommendedScreenings: "Recommended Screenings",
    screeningHead: ["Screening", "Reason"],
    lifestyleGuidelines: "Lifestyle Guidelines",
    lifestyleHead: ["Guideline", "Description"],
    topicsForDoctor: "Topics For Your Doctor",
    topicsHead: ["Topic", "Reason for Discussion"],
    yourAnswers: "Your Provided Answers",
    answersHead: ["Question", "Your Answer"],
    filename: "Doctors_Discussion_Guide",
  },
  pl: {
    title: "Przewodnik do Dyskusji z Lekarzem",
    disclaimer:
      "To jest przewodnik do dyskusji z pracownikiem służby zdrowia i nie stanowi porady medycznej.",
    overallSummary: "Ogólne Podsumowanie",
    recommendedScreenings: "Zalecane Badania Przesiewowe",
    screeningHead: ["Badanie", "Powód"],
    lifestyleGuidelines: "Wskazówki Dotyczące Stylu Życia",
    lifestyleHead: ["Wskazówka", "Opis"],
    topicsForDoctor: "Tematy do Omówienia z Lekarzem",
    topicsHead: ["Temat", "Powód do dyskusji"],
    yourAnswers: "Twoje Udzielone Odpowiedzi",
    answersHead: ["Pytanie", "Twoja Odpowiedź"],
    filename: "Przewodnik_Do_Dyskusji_Z_Lekarzem",
  },
};

const addSection = (
  doc: jsPDFWithAutoTable,
  title: string,
  content: () => void,
  startY: number,
): number => {
  if (startY > 250) {
    doc.addPage();
    startY = 20;
  }
  doc.setFontSize(14);
  doc.text(title, 14, startY);
  startY += 8;
  content();
  return (doc.autoTable.previous?.finalY ?? startY) + 12;
};

export const generateAssessmentPdf = (
  planData: ActionPlan,
  answers: Record<string, string>,
  locale: string = "en",
) => {
  const t = translations[locale] || translations.en;
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // --- Header ---
  doc.setFontSize(18);
  doc.text(t.title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(t.disclaimer, 14, 30);

  let startY = 45;

  // --- Overall Summary ---
  if (planData.overallSummary) {
    doc.setFontSize(12);
    doc.text(t.overallSummary, 14, startY);
    startY += 7;
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(planData.overallSummary, 180);
    doc.text(summaryLines, 14, startY);
    startY += summaryLines.length * 5 + 10;
  }

  // --- Sections ---
  if (planData.recommendedScreenings.length > 0) {
    startY = addSection(doc, t.recommendedScreenings, () => {
      doc.autoTable({
        startY,
        head: [t.screeningHead],
        body: planData.recommendedScreenings.map((s) => [s.title, s.why]),
        theme: "striped",
        headStyles: { fillColor: [22, 163, 74] },
      });
    }, startY);
  }

  if (planData.lifestyleGuidelines.length > 0) {
    startY = addSection(doc, t.lifestyleGuidelines, () => {
      doc.autoTable({
        startY,
        head: [t.lifestyleHead],
        body: planData.lifestyleGuidelines.map((l) => [l.title, l.description]),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
      });
    }, startY);
  }
  
  if (planData.topicsForDoctor.length > 0) {
    startY = addSection(doc, t.topicsForDoctor, () => {
      doc.autoTable({
        startY,
        head: [t.topicsHead],
        body: planData.topicsForDoctor.map((topic) => [topic.title, topic.why]),
        theme: "striped",
        headStyles: { fillColor: [245, 158, 11] },
      });
    }, startY);
  }

  if (Object.keys(answers).length > 0) {
    startY = addSection(doc, t.yourAnswers, () => {
      doc.autoTable({
        startY,
        head: [t.answersHead],
        body: Object.entries(answers).map(([key, value]) => [
          key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 
          value
        ]),
        theme: "grid",
        headStyles: { fillColor: [100, 116, 139] },
      });
    }, startY);
  }

  doc.save(`${t.filename}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`);
};
      