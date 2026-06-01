export function parseCorsOrigins(value?: string): string[] {
  if (!value || value.trim().length === 0) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
