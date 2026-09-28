// Which time period a Wrapped covers: the last 12 months (year = null)
// or one calendar year. Pure functions; "now" is always passed in.

export const FIRST_YEAR = 2008; // GitHub launched in 2008

// "?year=2025" -> 2025. Anything else (missing, not a number, before
// GitHub existed, in the future) -> null, which means the last 12 months.
export function parseYear(
  value: string | string[] | undefined | null,
  currentYear: number,
): number | null {
  if (typeof value !== "string" || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= FIRST_YEAR && year <= currentYear ? year : null;
}

// GitHub's GraphQL `from`/`to` for one calendar year (UTC). GitHub rejects
// ranges longer than one year, so this never spans more.
export function yearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` };
}

// Text for headings: "In the last 12 months" / "In 2025".
export function periodLabel(year: number | null): string {
  return year === null ? "the last 12 months" : String(year);
}

// Years a user can pick, newest first: from the year they joined GitHub
// up to this year.
export function availableYears(
  joinedYear: number,
  currentYear: number,
): number[] {
  const first = Math.max(joinedYear, FIRST_YEAR);
  const years: number[] = [];
  for (let year = currentYear; year >= first; year--) years.push(year);
  return years;
}

// Push times come from the public events API, which only keeps about the
// last 30 days, so a past year has no hour data at all.
export function isPastYear(year: number | null, currentYear: number): boolean {
  return year !== null && year < currentYear;
}
