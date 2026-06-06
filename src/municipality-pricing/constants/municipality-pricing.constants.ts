export const MUNICIPALITIES = [
  'Mariño',
  'Maneiro',
  'García',
  'Arismendi',
  'Antolín',
  'Gómez',
  'Marcano',
  'Díaz',
  'Tubores',
  'P. Macanao',
] as const;

export type MunicipalityName = (typeof MUNICIPALITIES)[number];
