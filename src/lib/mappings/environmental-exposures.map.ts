/**
 * Maps user-friendly environmental exposure values (from env.summary) to SNOMED CT codes.
 * This ensures that data sent for AI processing is standardized.
 */
export const environmentalExposuresMap: Record<string, string> = {
  'traffic_air': '224295000', // Exposure to air pollution (event)
  'industry': '424169001', // Exposure to industrial pollution (event)
  'solid_fuel': '419630009', // Exposure to wood smoke (event) - Proxy for indoor solid fuel
  'radon': '409579002', // Exposure to radon (event)
  'asbestos': '406482008', // Exposure to asbestos (event)
  'private_well': '418029006', // Water source: well (observable entity) - Used to flag potential water risk
  'pesticides': '418933005', // Exposure to pesticide (event)
  'sunbed': '413233009', // Exposure to artificial UV light (event)
};
