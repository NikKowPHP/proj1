/**
 * Maps user-friendly cancer type values to SNOMED CT codes.
 * This ensures that data sent for AI processing is standardized.
 */
export const cancerTypesMap: Record<string, string> = {
  // Common cancer types from the questionnaire
  'breast': '254837009', // Malignant neoplasm of breast (disorder)
  'lung': '363346000', // Malignant neoplasm of lung (disorder)
  'prostate': '399068003', // Malignant neoplasm of prostate (disorder)
  'colorectal': '363406005', // Malignant neoplasm of colon, rectum and anus (disorder)
  
  // Add other common types as needed
  // ...
};
