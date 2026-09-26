/** "2023", "2023 – 2024", or "2026 – Present" when there is no end year. */
export function formatYearRange(startYear: number, endYear?: number): string {
  if (endYear === undefined) return `${startYear} – Present`;
  if (endYear === startYear) return String(startYear);
  return `${startYear} – ${endYear}`;
}
