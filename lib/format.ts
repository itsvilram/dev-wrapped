export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// 9 -> "09:00"
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

// 42.4 -> "42%", 0.3 -> "<1%"
export function formatPercent(percent: number): string {
  return percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

// 12345 -> "12,345"
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

// plural(1, "day") -> "day", plural(3, "day") -> "days"
export function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}
