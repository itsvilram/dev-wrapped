import { describe, expect, it } from "vitest";
import {
  WEEKDAYS,
  formatHour,
  formatNumber,
  formatPercent,
  plural,
} from "./format";

describe("format helpers", () => {
  it("formats hours as HH:00", () => {
    expect(formatHour(0)).toBe("00:00");
    expect(formatHour(9)).toBe("09:00");
    expect(formatHour(23)).toBe("23:00");
  });

  it("rounds percentages and shows tiny ones as <1%", () => {
    expect(formatPercent(42.4)).toBe("42%");
    expect(formatPercent(0.3)).toBe("<1%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("adds thousands separators", () => {
    expect(formatNumber(12345)).toBe("12,345");
  });

  it("uses the singular only for exactly 1", () => {
    expect(plural(1, "day")).toBe("day");
    expect(plural(0, "day")).toBe("days");
    expect(plural(2, "commit")).toBe("commits");
  });

  it("maps GitHub weekday numbers to names", () => {
    expect(WEEKDAYS[0]).toBe("Sunday");
    expect(WEEKDAYS[6]).toBe("Saturday");
  });
});
