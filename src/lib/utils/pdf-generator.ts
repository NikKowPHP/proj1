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

// Define styling constants for easier tweaking
const STYLING = {
  FONT_SIZES: {
    TITLE: 22,
    SUMMARY: 10,
    BODY: 10,
    HEADER_BAR: 10,
  },
  LINE_HEIGHT: 1.4,
  CHAR_SPACE: 0.05,
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
      smoking_duration: "Długość palenia",
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
  doc.setFontSize(STYLING.FONT_SIZES.HEADER_BAR);
  doc.setTextColor(THEME.HEADER_TEXT_COLOR);
  doc.text(title, padding + 4, startY + headerHeight / 2 + 2.5);

  return startY + headerHeight + 5;
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
  doc.setCharSpace(STYLING.CHAR_SPACE);

  // FIX: Resized logo and adjusted margins
  doc.addImage(onkonoLogoBase64, "PNG", pageMargin, 20, 45, 10.5);

  doc.setFontSize(STYLING.FONT_SIZES.TITLE);
  doc.setFont("OpenSans", "bold");
  doc.text(t.title, pageMargin, 45); // FIX: Adjusted Y position
  
  doc.setFont("OpenSans", "normal");
  doc.setFontSize(STYLING.FONT_SIZES.BODY);
  doc.setTextColor(100);
  doc.text(t.disclaimer, pageMargin, 53, { lineHeightFactor: STYLING.LINE_HEIGHT }); // FIX: Added line height

  let startY = 65; // FIX: Increased margin

  if (planData.overallSummary) {
    doc.setFontSize(STYLING.FONT_SIZES.SUMMARY);
    const summaryLines = doc.splitTextToSize(planData.overallSummary, doc.internal.pageSize.getWidth() - (pageMargin * 2));
    doc.text(summaryLines, pageMargin, startY, { lineHeightFactor: STYLING.LINE_HEIGHT }); // FIX: Added line height
    startY += summaryLines.length * STYLING.FONT_SIZES.SUMMARY * 0.35 * STYLING.LINE_HEIGHT + 12; // FIX: Increased margin
  }
  
  const checkPageBreak = (currentY: number) => {
    if (currentY > 260) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  // Define common styles for all tables to keep them consistent
  const commonTableStyles = {
    showHead: false,
    theme: "plain",
    styles: {
      cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 1 },
      font: "OpenSans",
      fontSize: STYLING.FONT_SIZES.BODY,
      valign: 'top', // FIX: Ensures top alignment for all cells
      lineHeight: STYLING.LINE_HEIGHT, // FIX: Adds line height to table text
    },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: pageMargin },
  };

  if (planData.recommendedScreenings.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.recommendedScreenings, startY);
    doc.autoTable({
      startY,
      body: planData.recommendedScreenings.map((s) => [s.title, s.why]),
      ...commonTableStyles,
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 12; // FIX: Increased margin
  }

  if (planData.lifestyleGuidelines.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.lifestyleGuidelines, startY);
    doc.autoTable({
      startY,
      body: planData.lifestyleGuidelines.map((l) => [l.title, l.description]),
      ...commonTableStyles,
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 12;
  }

  if (planData.topicsForDoctor.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.topicsForDoctor, startY);
    doc.autoTable({
      startY,
      body: planData.topicsForDoctor.map((topic) => [topic.title, topic.why]),
      ...commonTableStyles,
    });
    startY = (doc.autoTable.previous?.finalY ?? startY) + 12;
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
      ...commonTableStyles,
    });
  }

  doc.save(
    `${t.filename}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
  );
};