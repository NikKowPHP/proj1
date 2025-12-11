import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ActionPlan } from "../types";
import { onkonoLogoBase64 } from "../assets/onkono-logo-base64";
import { openSansBold } from "../assets/open-sans-bold-base64";
import { openSansRegular } from "../assets/open-sans-regular-base64";

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
      "information to support discussion with a doctor / not a diagnosis",
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
      symptom_details_prefix: "Details for Symptom",
      illness_details_prefix: "Details for",
    },
  },
  pl: {
    title: "Przewodnik do Dyskusji z Lekarzem",
    disclaimer:
      "informacje wspierające rozmowę z lekarzem / nie diagnoza",
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
      symptom_details_prefix: "Szczegóły objawu",
      illness_details_prefix: "Szczegóły dla",
    },
  },
};

const drawSectionHeader = (doc: jsPDF, title: string, startY: number): number => {
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
  if (typeof value !== 'string' || !value.trim().length) {
    return value;
  }
  
  const trimmedValue = value.trim();
  if (!((trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) || (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')))) {
      return value;
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return "None";

      if (parsed.every(item => typeof item === 'string')) {
        return parsed.join(', ');
      }
      
      if (key === 'family_cancer_history') {
        return parsed.map(item => `${item.relation || 'Relative'}${item.cancer_type ? ` (${item.cancer_type} at age ${item.age_dx || 'N/A'})` : ''}`).join('; ');
      }
      if (key === 'personal_cancer_history') {
        return parsed.map(item => `${item.type || 'Cancer'}${item.year_dx ? ` (diagnosed ${item.year_dx})` : ''}`).join('; ');
      }
      if (key === 'occupational_hazards') {
        return parsed.map(item => `${item.job_title || 'Job'}${item.job_years ? ` (${item.job_years} years)` : ''}`).join('; ');
      }
      if (key === 'labs_and_imaging') {
        return parsed.map(item => `${item.study_type || 'Study'}${item.study_date ? ` (${item.study_date})` : ''}`).join('; ');
      }

      if (parsed.every(item => typeof item === 'object' && item !== null)) {
        return `${parsed.length} detailed entry/entries provided.`;
      }
      
      return value;
    }

    if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed)
            .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${v}`)
            .join(', ');
    }

    return value;
  } catch (e) {
    return value;
  }
}

const formatQuestionKey = (key: string, t: any): string => {
    if (key.startsWith('symptom_details_')) {
        const symptomId = key.replace('symptom_details_', '');
        return `${t.answersMap['symptom_details_prefix'] || 'Details for Symptom'} (${symptomId})`;
    }
     if (key.startsWith('illness_details_')) {
        const illnessId = key.replace('illness_details_', '');
        const formattedIllnessId = illnessId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        return `${t.answersMap['illness_details_prefix'] || 'Details for'} ${formattedIllnessId}`;
    }
    return t.answersMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};


export const generateAssessmentPdf = (
  planData: ActionPlan,
  answers: Record<string, string>,
  locale: string = "en",
) => {
  const t = translations[locale] || translations.en;
  const doc = new jsPDF();
  const pageMargin = 14;

  doc.addFileToVFS("OpenSans-Regular.ttf", openSansRegular);
  doc.addFileToVFS("OpenSans-Bold.ttf", openSansBold);
  doc.addFont("OpenSans-Regular.ttf", "OpenSans", "normal");
  doc.addFont("OpenSans-Bold.ttf", "OpenSans", "bold");

  doc.setFont("OpenSans", "normal");
  doc.setTextColor(THEME.TEXT_COLOR);
  doc.setCharSpace(STYLING.CHAR_SPACE);

  doc.addImage(onkonoLogoBase64, "PNG", pageMargin, 20, 45, 10.5);

  doc.setFontSize(STYLING.FONT_SIZES.TITLE);
  doc.setFont("OpenSans", "bold");
  doc.text(t.title, pageMargin, 45);
  
  doc.setFont("OpenSans", "normal");
  doc.setFontSize(STYLING.FONT_SIZES.BODY);
  doc.setTextColor(100);
  doc.text(t.disclaimer, pageMargin, 53, { lineHeightFactor: STYLING.LINE_HEIGHT });

  let startY = 65;

  if (planData.overallSummary) {
    doc.setFontSize(STYLING.FONT_SIZES.SUMMARY);
    const summaryLines = doc.splitTextToSize(planData.overallSummary, doc.internal.pageSize.getWidth() - (pageMargin * 2));
    doc.text(summaryLines, pageMargin, startY, { lineHeightFactor: STYLING.LINE_HEIGHT });
    startY += summaryLines.length * STYLING.FONT_SIZES.SUMMARY * 0.35 * STYLING.LINE_HEIGHT + 12;
  }
  
  const checkPageBreak = (currentY: number) => {
    if (currentY > 260) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  const commonTableStyles = {
    showHead: false,
    theme: "plain" as const,
    styles: {
      cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 1 },
      font: "OpenSans",
      fontSize: STYLING.FONT_SIZES.BODY,
      valign: 'top' as const,
      lineHeight: STYLING.LINE_HEIGHT,
    },
    columnStyles: { 0: { fontStyle: 'bold' as const } },
    margin: { left: pageMargin },
  };

  if (planData.recommendedScreenings.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.recommendedScreenings, startY);
    autoTable(doc, {
      startY,
      body: planData.recommendedScreenings.map((s) => [s.title, s.why]),
      ...commonTableStyles,
    });
    startY = ((doc as any).lastAutoTable?.finalY ?? startY) + 12;
  }

  if (planData.lifestyleGuidelines.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.lifestyleGuidelines, startY);
    autoTable(doc, {
      startY,
      body: planData.lifestyleGuidelines.map((l) => [l.title, l.description]),
      ...commonTableStyles,
    });
    startY = ((doc as any).lastAutoTable?.finalY ?? startY) + 12;
  }

  if (planData.topicsForDoctor.length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.topicsForDoctor, startY);
    autoTable(doc, {
      startY,
      body: planData.topicsForDoctor.map((topic) => [topic.title, topic.why]),
      ...commonTableStyles,
    });
    startY = ((doc as any).lastAutoTable?.finalY ?? startY) + 12;
  }

  if (Object.keys(answers).length > 0) {
    startY = checkPageBreak(startY);
    startY = drawSectionHeader(doc, t.yourAnswers, startY);
    
    // Filter out internal derived scores or flags that shouldn't be shown to the user
    // This ensures no "risk scores" are printed in the PDF
    const filteredAnswers = Object.entries(answers).filter(([key]) => {
        return !key.startsWith('derived.') && 
               !key.includes('_score') && 
               !key.includes('brinkman_index');
    });

    autoTable(doc, {
      startY,
      body: filteredAnswers.map(([key, value]) => [
        formatQuestionKey(key, t),
        formatAnswerValue(value, key),
      ]),
      ...commonTableStyles,
    });
  }

  doc.save(
    `${t.filename}_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`,
  );
};
