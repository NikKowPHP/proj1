```xml
<response>
  <reasoning>
    I will refactor the `src/lib/utils/pdf-generator.ts` file to align with the detailed to-do list provided. My plan is to overhaul the PDF generation logic to precisely match the visual design described, which features a branded header with a logo and custom-drawn section headers in a consistent brand color.

    Key actions will include:
    1.  Creating a `THEME` constant for brand colors and a placeholder Base64 string for the logo.
    2.  Adding the logo and a standardized font to the document.
    3.  Implementing a new `drawSectionHeader` helper function to create the custom-colored header bars for each section.
    4.  Modifying the main `generateAssessmentPdf` function to use this new helper for all data sections (`recommendedScreenings`, `lifestyleGuidelines`, `topicsForDoctor`, and `answers`).
    5.  Configuring all `jspdf-autotable` calls to use a `'plain'` theme and to hide their default headers (`showHead: false`), as our custom headers replace them.
    6.  Adjusting vertical spacing to ensure a clean, professional layout that mirrors the target design.
    7.  Finally, I will create a new `TASKS.md` file and add this refactoring task, marking it as complete.
  </reasoning>
  <modifications>
    
    <file path="src/lib/utils/pdf-generator.ts">
      <![CDATA[
import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ActionPlan } from "../types";

// --- Task 2: Prepare and Embed Logo Asset ---
// NOTE: Replace this placeholder with the actual Base64 encoded logo from /onkono-logo.png
const LOGO_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAAA+CAYAAABaGeWUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARTSURBVHhe7d2/ThRRFMfxr5AQCQUhpBCFREiIBAnxJ0hIKDRBEAMJDSkEDRIaKo2ChoaGmqhoCEgIARpCgmA0aDQkBCFEQhAECfGfY/7Mzc7u3N29d3Zn4PM5SXYzu3fu3J2d3Zk9IBAw8N8T2dRLQMAgYBAwCLETBBgDBgGDgEHEJgQwBgwCBgGDiE0IYAwYBAwChhAb0ZoZ2VxcP0Y6AwbxGzQYWCYMBAwCBiE2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYBAwCBgEDCI2QoAXYDA8AgYBAwCBhGbEAAZ8CAcR8ZBAYBg4BBxCYEMAYMAgYBg4hNCGAMGAQMAgYRG9GaGdlcXH9EOgMG8Rs0GFgmGAQMAgYhNiKAxyZgEDAI/gOJaL3wF/x3rwAAAABJRU5ErkJggg==";

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
      ]]>
    </file>
  </modifications>
</response>
```