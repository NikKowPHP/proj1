/**
 * Maps common gene IDs to their official HGNC symbols.
 * While often the same, this provides a single source of truth and allows for aliases.
 */
export const geneticGenesMap: Record<string, string> = {
  'BRCA1': 'BRCA1',
  'BRCA2': 'BRCA2',
  'MLH1': 'MLH1',
  'MSH2': 'MSH2',
  'MSH6': 'MSH6',
  'PMS2': 'PMS2',
  'APC': 'APC',
  'TP53': 'TP53',
  'PTEN': 'PTEN',
  'STK11': 'STK11',
  'PALB2': 'PALB2',
  'CDH1': 'CDH1',
  // ... add more from spec as needed
};
