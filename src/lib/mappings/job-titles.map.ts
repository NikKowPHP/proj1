/**
 * Maps user-friendly job title values to ISCO-08 codes.
 * ISCO-08 is the International Standard Classification of Occupations.
 * This ensures that data sent for AI processing is standardized.
 */
export const jobTitlesMap: Record<string, string> = {
  'welder': '7212',
  'miner': '8111',
  'nurse': '2221',
  'driver': '8322',
  'mechanic': '7231',
  'hairdresser': '5141',
  'painter': '7131',
  'farmer': '6111',
  'firefighter': '5411',
  'construction worker': '9313',
  'healthcare worker': '2221', 
  'chemical plant operator': '8131',
  'factory worker': '9329',
  'insulation worker': '7124',
  'shipyard worker': '7214',
  'laboratory worker': '3111',
  // Specific high-risk roles from spec
  'shoemaker': '7536', // Leather dust risk
  'cobbler': '7536',
  'chimney sweep': '9629', // Soot/PAH risk
  'roofer': '7121', // Bitumen/Tar/Asbestos risk
  'radiologist': '221', // Radiation
  'radiographer': '3211' // Radiation
};
