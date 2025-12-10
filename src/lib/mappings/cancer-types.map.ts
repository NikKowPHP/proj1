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
  
  // Expanded list based on PDF spec:
  'endometrium': '371973000', // Malignant neoplasm of endometrium
  'oesophagus': '363402007', // Malignant neoplasm of esophagus
  'pancreas': '363418001', // Malignant neoplasm of pancreas
  'liver': '93870000', // Malignant neoplasm of liver
  'bladder': '363455001', // Malignant neoplasm of bladder
  'brain': '109841003', // Malignant neoplasm of brain
  'thyroid': '363478007', // Malignant neoplasm of thyroid gland
  'sarcoma': '420120006', // Sarcoma
  'lymphoma': '118600007', // Malignant lymphoma
  'leukemia': '93143009', // Leukemia
  'myeloma': '109989006', // Multiple myeloma
  'kidney': '363518003', // Malignant neoplasm of kidney
  'melanoma': '126488004', // Malignant melanoma of skin
  'gastric': '363349007', // Malignant neoplasm of stomach
  'ovarian': '363443007', // Malignant neoplasm of ovary
  'other': '363346000' // Placeholder/General (consider refining)
};
