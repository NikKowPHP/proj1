/**
 * Maps user-friendly occupational exposure values to SNOMED CT codes.
 * This ensures that data sent for AI processing is standardized.
 */
export const occupationalExposuresMap: Record<string, string> = {
  'asbestos': '406482008', // Exposure to asbestos (event)
  'silica': '406484009', // Exposure to silica (event)
  'wood_dust': '425264009', // Exposure to wood dust (event)
  'diesel_exhaust': '413350004', // Exposure to diesel engine exhaust (event)
  'welding_fumes': '426156009', // Exposure to welding fumes (event)
  'benzene': '76543000', // Exposure to benzene (event)
  'formaldehyde': '284587009', // Exposure to formaldehyde (event)
  // ... add more from spec as needed
};
