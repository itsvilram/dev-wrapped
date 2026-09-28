// Builds the app's URLs in one place so every link agrees on the format.

// /torvalds or /torvalds?year=2025
export function wrappedPath(login: string, year: number | null): string {
  return year === null ? `/${login}` : `/${login}?year=${year}`;
}

// /api/card/torvalds?year=2025&tz=Asia%2FKolkata (both parameters optional)
export function cardPath(
  login: string,
  { year, timeZone }: { year: number | null; timeZone?: string | null },
): string {
  const params = new URLSearchParams();
  if (year !== null) params.set("year", String(year));
  if (timeZone) params.set("tz", timeZone);
  const query = params.toString();
  return `/api/card/${login}${query ? `?${query}` : ""}`;
}
