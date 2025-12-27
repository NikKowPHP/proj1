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
  // ... add more from spec as needed
};
