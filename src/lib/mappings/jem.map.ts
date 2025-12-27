
export const jemMap: Record<string, string[]> = {
  '7212': ['welding_fumes'], // Welder
  '8111': ['silica', 'diesel_exhaust'], // Miner
  '7131': ['benzene'], // Painter (for solvents)
  '6111': ['diesel_exhaust'], // Farmer (for machinery)
  '5411': ['diesel_exhaust', 'asbestos'], // Firefighter (exhaust from vehicles, asbestos in old buildings)
  '7231': ['benzene', 'diesel_exhaust', 'asbestos'] // Mechanic (solvents, exhaust, brake linings)
};
