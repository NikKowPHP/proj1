import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ActionPlan } from "../types";
import { onkonoLogoBase64 } from "../assets/onkono-logo-base64";
import { openSansBold } from "../assets/open-sans-bold-base64";
import { openSansRegular } from "../assets/open-sans-regular-base64";

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
      intent: "Goal",
      source: "Form filled by",
      language: "Language",
      dob: "Date of Birth",
      sex_at_birth: "Sex at Birth",
      gender_identity: "Gender Identity",
      height_cm: "Height (cm)",
      weight_kg: "Weight (kg)",
      smoking_status: "Smoking Status",
      cigs_per_day: "Cigarettes per day",
      smoking_years: "Years smoked",
      smoking_duration: "Smoking Duration",
      alcohol_use: "Alcohol Consumption",
      alcohol: "Alcohol Consumption",
      diet_pattern: "Diet Pattern",
      activity_level: "Activity Level",
      activity: "Weekly Activity",
      symptoms: "Symptoms",
      family_cancer_any: "Family History of Cancer",
      illness_any: "Chronic Illnesses",
      cancer_any: "Personal History of Cancer",
      job_history_enable: "Occupation details provided",
      family_cancer_history: "Family Cancer Details",
      personal_cancer_history: "Personal Cancer Details",
      illness_list: "Diagnosed Conditions",
      occupational_hazards: "Occupational History",
      labs_and_imaging: "Labs & Imaging",
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
      intent: "Cel",
      source: "Formularz wypełniony przez",
      language: "Język",
      dob: "Data urodzenia",
      sex_at_birth: "Płeć przy urodzeniu",
      gender_identity: "Tożsamość płciowa",
      height_cm: "Wzrost (cm)",
      weight_kg: "Waga (kg)",
      smoking_status: "Status palenia",
      cigs_per_day: "Papierosy dziennie",
      smoking_years: "Lata palenia",
      smoking_duration: "Okres palenia",
      alcohol_use: "Spożycie alkoholu",
      alcohol: "Spożycie alkoholu",
      diet_pattern: "Wzorzec żywieniowy",
      activity_level: "Poziom aktywności",
      activity: "Aktywność tygodniowa",
      symptoms: "Objawy",
      family_cancer_any: "Historia raka w rodzinie",
      illness_any: "Choroby przewlekłe",
      cancer_any: "Osobista historia nowotworów",
      job_history_enable: "Podano szczegóły zawodowe",
      family_cancer_history: "Szczegóły historii raka w rodzinie",
      personal_cancer_history: "Szczegóły osobistej historii nowotworów",
      illness_list: "Zdiagnozowane schorzenia",
      occupational_hazards: "Historia zawodowa",
      labs_and_imaging: "Badania laboratoryjne i obrazowe",
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

function formatAnswerValue(value: any, key: string): string {
  // If value is not a string or doesn't look like an array, return it as is.
  if (typeof value !== 'string' || !value.trim().startsWith('[') || !value.trim().endsWith(']')) {
    return value;
  }

  try {
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) return value;
    if (arr.length === 0) return "None";

    // Handle simple string arrays
    if (arr.every(item => typeof item === 'string')) {
      // Special formatting for symptom IDs to make them more readable.
      if (key === 'symptoms') {
        return arr.map(s => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ');
      }
      return arr.join(', ');
    }
    
    // Handle array of objects with special formatting for known keys
    if (key === 'family_cancer_history') {
      return arr.map(item => `${item.relation || 'Relative'}${item.cancer_type ? ` (${item.cancer_type})` : ''}`).join('; ');
    }
    if (key === 'personal_cancer_history') {
      return arr.map(item => `${item.type || 'Cancer'}${item.year_dx ? ` (diagnosed ${item.year_dx})` : ''}`).join('; ');
    }
    if (key === 'occupational_hazards') {
      return arr.map(item => `${item.job_title || 'Job'}${item.job_years ? ` (${item.job_years} years)` : ''}`).join('; ');
    }
    if (key === 'labs_and_imaging') {
      return arr.map(item => `${item.study_type || 'Study'}${item.study_date ? ` (${item.study_date})` : ''}`).join('; ');
    }

    // Generic fallback for other object arrays
    if (arr.every(item => typeof item === 'object' && item !== null)) {
      return `${arr.length} detailed entry/entries provided.`;
    }

    return value; // Fallback to original string if it's a mixed array or something unexpected
  } catch (e) {
    return value; // Not valid JSON, return as is
  }
}

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
        formatAnswerValue(value, key),
      ]),
      ...commonTableStyles,
    });
  }

  doc.save(
    `${t.filename}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
  );
};
      