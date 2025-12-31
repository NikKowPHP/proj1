/**
 * Maps user-friendly medical condition IDs to SNOMED CT codes.
 * This ensures that data sent for AI processing is standardized.
 */
export const medicalConditionsMap: Record<string, string> = {
  // Conditions from the questionnaire (cond.summary)
  'diabetes': '44054006', // Diabetes mellitus (disorder)
  'hypertension': '38341003', // Hypertensive disorder, systemic arterial (disorder)
  'ibd': '24526004', // Inflammatory bowel disease (disorder)
  'hbv': '66071002', // Type B viral hepatitis (disorder)
  'hcv': '50711007', // Type C viral hepatitis (disorder)
  'cirrhosis': '19943007', // Cirrhosis of liver (disorder)
  'hpv': '240532009', // Human papillomavirus infection (disorder)
  'h_pylori': '32050005', // Helicobacter pylori infection (disorder)
  'hiv': '86406008', // Human immunodeficiency virus infection (disorder)
  'transplant': '313039003', // Recipient of solid organ transplant (finding)
  'immunosuppression': '702434007', // Immunosuppression status (finding)
  'psc': '235902008', // Primary sclerosing cholangitis (disorder)
  'pancreatitis': '196898004', // Chronic pancreatitis (disorder)
  'cond.copd': '13645005', // Chronic obstructive lung disease (disorder)
  'other': '74964007' // Other (qualifier value)
};
