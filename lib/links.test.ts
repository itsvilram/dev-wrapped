import { describe, expect, it } from "vitest";
import { cardPath, wrappedPath } from "./links";

describe("wrappedPath", () => {
  it("adds ?year= only for a specific year", () => {
    expect(wrappedPath("octo", null)).toBe("/octo");
    expect(wrappedPath("octo", 2025)).toBe("/octo?year=2025");
  });
});

describe("cardPath", () => {
  it("has no query string for the default card", () => {
    expect(cardPath("octo", { year: null })).toBe("/api/card/octo");
  });

  it("adds the year and an encoded timezone", () => {
    expect(cardPath("octo", { year: 2025, timeZone: "Asia/Kolkata" })).toBe(
      "/api/card/octo?year=2025&tz=Asia%2FKolkata",
    );
  });

  it("leaves out a missing timezone", () => {
    expect(cardPath("octo", { year: null, timeZone: null })).toBe(
      "/api/card/octo",
    );
  });
});
