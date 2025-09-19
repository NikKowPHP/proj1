/**
 * Maps user-friendly medical condition IDs to SNOMED CT codes.
 * This ensures that data sent for AI processing is standardized.
 */
export const medicalConditionsMap: Record<string, string> = {
  // Conditions from the questionnaire
  'diabetes': '44054006', // Diabetes mellitus (disorder)
  'hypertension': '38341003', // Hypertensive disorder, systemic arterial (disorder)
  'ibd': '24526004', // Inflammatory bowel disease (disorder)
  
  // Add other conditions from the spec
  // ...
};
