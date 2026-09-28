import { describe, expect, it } from "vitest";
import {
  availableYears,
  isPastYear,
  parseYear,
  periodLabel,
  yearRange,
} from "./period";

describe("parseYear", () => {
  it("accepts a four-digit year from 2008 up to this year", () => {
    expect(parseYear("2025", 2026)).toBe(2025);
    expect(parseYear("2008", 2026)).toBe(2008);
    expect(parseYear("2026", 2026)).toBe(2026);
  });

  it("falls back to the last 12 months (null) for anything else", () => {
    expect(parseYear(undefined, 2026)).toBeNull();
    expect(parseYear(null, 2026)).toBeNull();
    expect(parseYear("", 2026)).toBeNull();
    expect(parseYear("abc", 2026)).toBeNull();
    expect(parseYear("2007", 2026)).toBeNull(); // before GitHub
    expect(parseYear("2027", 2026)).toBeNull(); // future
    expect(parseYear("2025.5", 2026)).toBeNull();
    expect(parseYear(["2025", "2024"], 2026)).toBeNull(); // ?year=2025&year=2024
  });
});

describe("yearRange", () => {
  it("covers the whole calendar year in UTC", () => {
    expect(yearRange(2024)).toEqual({
      from: "2024-01-01T00:00:00Z",
      to: "2024-12-31T23:59:59Z",
    });
  });
});

describe("periodLabel", () => {
  it("reads well after 'In'", () => {
    expect(`In ${periodLabel(null)}`).toBe("In the last 12 months");
    expect(`In ${periodLabel(2025)}`).toBe("In 2025");
  });
});

describe("availableYears", () => {
  it("lists years from this year back to the year the user joined", () => {
    expect(availableYears(2023, 2026)).toEqual([2026, 2025, 2024, 2023]);
  });

  it("is just this year for a brand-new user", () => {
    expect(availableYears(2026, 2026)).toEqual([2026]);
  });

  it("never goes before 2008", () => {
    expect(availableYears(1999, 2009)).toEqual([2009, 2008]);
  });
});

describe("isPastYear", () => {
  it("is true only for a finished calendar year", () => {
    expect(isPastYear(2025, 2026)).toBe(true);
    expect(isPastYear(2026, 2026)).toBe(false);
    expect(isPastYear(null, 2026)).toBe(false);
  });
});
