/**
 * Maps user-friendly occupational exposure values to SNOMED CT codes.
 * This ensures that data sent for AI processing is standardized.
 */
export const occupationalExposuresMap: Record<string, string> = {
  'radon': '409569002', // Exposure to radon (event)
  'asbestos': '406482008', // Exposure to asbestos (event)
  'silica': '406484009', // Exposure to silica (event)
  'wood_dust': '425264009', // Exposure to wood dust (event)
  'diesel_exhaust': '413350004', // Exposure to diesel engine exhaust (event)
  'welding_fumes': '426156009', // Exposure to welding fumes (event)
  'benzene': '76543000', // Exposure to benzene (event)
  'formaldehyde': '284587009', // Exposure to formaldehyde (event)
  'pesticides': '418933005', // Exposure to pesticide (event)
  'solvents': '422329007', // Exposure to organic solvent (event)
  'radiation': '417387002', // Exposure to ionizing radiation (event)
  'leather_dust': '414441007', // Exposure to leather dust (event)
  'metal_fluids': '422961005', // Exposure to metalworking fluid (event)
  'soot': '419799009', // Exposure to soot (event)
  'rubber': '419137000', // Exposure to rubber fume (event)
  'shift_night': '406505007', // Night shift worker (finding)
  'firefighter': '413348003', // Exposure to fire smoke (event) - proxy for firefighter hazard
  'uv_sunlight': '69930006', // Exposure to UV radiation (event)
  // Aliases or grouped items from PDF
  'pahs': '419799009', // Exposure to soot (event) - Mapping PAHs to Soot/Coal Tar code
  'rubber_chem': '419137000', // Mapping rubber chemicals to rubber fume
  'painter': '66238002' // Painter (occupation)
};
