import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ActionPlan } from "../types";
import { onkonoLogoBase64 } from "../assets/onkono-logo-base64";
import { openSansBold } from "../assets/open-sans-bold";
import { openSansRegular } from "../assets/open-sans-regular";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: {
    (options: any): jsPDF;
    previous?: { finalY: number };
  };
}

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
    answersMap: {
      age: "Age",
      sex: "Sex",
      height: "Height",
      weight: "Weight",
      smoking_status: "Smoking Status",
      smoking_duration: "Smoking Duration",
      alcohol: "Alcohol",
      activity: "Activity",
      diet_fruits_veg: "Diet Fruits/Veg",
      diet_red_meat: "Diet Red Meat",
      known_blood_pressure: "Known Blood Pressure",
      has_diabetes: "Has Diabetes",
      asbestos_exposure: "Asbestos Exposure",
      family_history_cancer: "Family History Cancer",
      units: "Units",
    },
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
    answersMap: {
      age: "Wiek",
      sex: "Płeć",
      height: "Wzrost",
      weight: "Waga",
      smoking_status: "Status palenia",
      smoking_duration: "Smoking Duration", // NOTE: This key may need translation in your app
      alcohol: "Alkohol",
      activity: "Aktywność",
      diet_fruits_veg: "Dieta Owoce/Warzywa",
      diet_red_meat: "Dieta Czerwone Mięso",
      known_blood_pressure: "Znane ciśnienie krwi",
      has_diabetes: "Cukrzyca",
      asbestos_exposure: "Narażenie na azbest",
      family_history_cancer: "Historia raka w rodzinie",
      units: "Jednostki",
    },
  },
};

const drawSectionHeader = (doc: jsPDFWithAutoTable, title: string, startY: number): number => {
  const headerHeight = 10;
  const padding = 14;

  doc.setFillColor(THEME.BRAND_COLOR);
  doc.rect(padding, startY, doc.internal.pageSize.getWidth() - (padding * 2), headerHeight, "F");

  doc.setFont("OpenSans", "bold");
  doc.setFontSize(12);
  doc.setTextColor(THEME.HEADER_TEXT_COLOR);
  doc.text(title, padding + 3, startY + headerHeight / 2 + 2);

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

  doc.addFileToVFS("OpenSans-Regular.ttf", openSansRegular);
  doc.addFileToVFS("OpenSans-Bold.ttf", openSansBold);
  doc.addFont("OpenSans-Regular.ttf", "OpenSans", "normal");
  doc.addFont("OpenSans-Bold.ttf", "OpenSans", "bold");

  doc.setFont("OpenSans", "normal");
  doc.setTextColor(THEME.TEXT_COLOR);

  doc.addImage(onkonoLogoBase64, "PNG", pageMargin, 15, 60, 10);

  doc.setFontSize(18);
  doc.setFont("OpenSans", "bold");
  doc.text(t.title, pageMargin, 40);
  doc.setFont("OpenSans", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(t.disclaimer, pageMargin, 48);

  let startY = 60;

  if (planData.overallSummary) {
    doc.setFontSize(11);
    const summaryLines = doc.splitTextToSize(planData.overallSummary, doc.internal.pageSize.getWidth() - (pageMargin * 2));
    doc.text(summaryLines, pageMargin, startY);
    startY += summaryLines.length * 5 + 10;
  }
  
  const checkPageBreak = (currentY: number) => {
    if (currentY > 260) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  if (planData.recommendedScreenings.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.recommendedScreenings, startY);
    doc.autoTable({
      startY,
      body: planData.recommendedScreenings.map((s) => [s.title, s.why]),
      showHead: false,
      theme: "plain",
      styles: {
        cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 1 }, // CHANGE: Reduced vertical padding
        font: "OpenSans",
        fontSize: 10,
      },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: pageMargin },
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 10;
  }

  if (planData.lifestyleGuidelines.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.lifestyleGuidelines, startY);
    doc.autoTable({
      startY,
      body: planData.lifestyleGuidelines.map((l) => [l.title, l.description]),
      showHead: false,
      theme: "plain",
      styles: {
        cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 1 }, // CHANGE: Reduced vertical padding
        font: "OpenSans",
        fontSize: 10,
      },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: pageMargin },
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 10;
  }

  if (planData.topicsForDoctor.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.topicsForDoctor, startY);
    doc.autoTable({
      startY,
      body: planData.topicsForDoctor.map((topic) => [topic.title, topic.why]),
      showHead: false,
      theme: "plain",
      styles: {
        cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 1 }, // CHANGE: Reduced vertical padding
        font: "OpenSans",
        fontSize: 10,
      },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: pageMargin },
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 10;
  }

  if (Object.keys(answers).length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.yourAnswers, startY);
    doc.autoTable({
      startY,
      body: Object.entries(answers).map(([key, value]) => [
        t.answersMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
      ]),
      showHead: false,
      theme: "plain",
      styles: {
        cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 1 }, // CHANGE: Reduced vertical padding
        font: "OpenSans",
        fontSize: 10,
      },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: pageMargin },
    });
  }

  doc.save(
    `${t.filename}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
  );
};