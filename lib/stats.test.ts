import { describe, expect, it } from "vitest";
import {
  busiestHour,
  busiestWeekday,
  computeStats,
  currentStreak,
  flattenDays,
  hourHistogram,
  languageShares,
  longestStreak,
  personality,
  personalityFor,
  topRepo,
  weekendShare,
  type PersonalityInput,
} from "./stats";
import type { ContributionDay, GitHubUser, LanguageShare } from "./types";

// Builds consecutive days starting at `start`, one per count.
function days(start: string, counts: number[]): ContributionDay[] {
  const first = new Date(`${start}T00:00:00Z`);
  return counts.map((contributionCount, i) => {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() + i);
    return {
      date: date.toISOString().slice(0, 10),
      contributionCount,
      weekday: date.getUTCDay(),
    };
  });
}

function repo(...langs: [name: string, size: number][]) {
  return {
    languages: {
      edges: langs.map(([name, size]) => ({
        size,
        node: { name, color: null },
      })),
    },
  };
}

function lang(name: string, percent: number): LanguageShare {
  return { name, color: null, bytes: percent, percent };
}

describe("flattenDays", () => {
  it("joins the weeks into one list, in order", () => {
    const [a, b, c] = days("2026-01-01", [1, 2, 3]);
    expect(
      flattenDays([{ contributionDays: [a, b] }, { contributionDays: [c] }]),
    ).toEqual([a, b, c]);
  });
});

describe("longestStreak", () => {
  it("is 0 for no days or no contributions", () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(days("2026-01-01", [0, 0, 0]))).toBe(0);
  });

  it("finds the longest run of days with contributions", () => {
    expect(longestStreak(days("2026-01-01", [1, 1, 0, 1, 1, 1, 0, 1]))).toBe(3);
  });

  it("counts a single active day as a streak of 1", () => {
    expect(longestStreak(days("2026-01-01", [0, 5, 0]))).toBe(1);
  });

  it("continues across a month and a year boundary", () => {
    // 30 Dec, 31 Dec, 1 Jan, 2 Jan
    expect(longestStreak(days("2025-12-30", [1, 1, 1, 1]))).toBe(4);
  });
});

describe("currentStreak", () => {
  it("is 0 when there are no days", () => {
    expect(currentStreak([])).toBe(0);
  });

  it("counts back from today", () => {
    expect(currentStreak(days("2026-01-01", [1, 0, 1, 1, 1]))).toBe(3);
  });

  it("does not break just because today has no contributions yet", () => {
    expect(currentStreak(days("2026-01-01", [1, 1, 1, 0]))).toBe(3);
  });

  it("is 0 when yesterday and today are both empty", () => {
    expect(currentStreak(days("2026-01-01", [1, 1, 0, 0]))).toBe(0);
  });
});

describe("languageShares", () => {
  it("is empty when there are no repos or languages", () => {
    expect(languageShares([])).toEqual([]);
    expect(languageShares([repo()])).toEqual([]);
  });

  it("adds bytes across repos and sorts biggest first", () => {
    const shares = languageShares([
      repo(["TypeScript", 600], ["CSS", 100]),
      repo(["Go", 200], ["TypeScript", 100]),
    ]);
    expect(shares.map((l) => [l.name, l.bytes, l.percent])).toEqual([
      ["TypeScript", 700, 70],
      ["Go", 200, 20],
      ["CSS", 100, 10],
    ]);
  });

  it("breaks ties by name so the order is stable", () => {
    const shares = languageShares([repo(["Rust", 50], ["C", 50])]);
    expect(shares.map((l) => l.name)).toEqual(["C", "Rust"]);
  });
});

describe("busiestWeekday", () => {
  it("is null when there are no contributions", () => {
    expect(busiestWeekday(days("2026-01-01", [0, 0, 0]))).toBeNull();
  });

  it("returns the weekday with the most contributions", () => {
    // 2026-01-05 is a Monday (weekday 1)
    expect(busiestWeekday(days("2026-01-05", [9, 1, 1, 1, 1, 1, 1]))).toBe(1);
  });

  it("adds up the same weekday across weeks", () => {
    // Two Wednesdays with 3 each beat one Monday with 5.
    const twoWeeks = days(
      "2026-01-05",
      [5, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
    );
    expect(busiestWeekday(twoWeeks)).toBe(3);
  });

  it("picks the earlier weekday on a tie", () => {
    // 2026-01-04 is a Sunday (0), then Monday (1)
    expect(busiestWeekday(days("2026-01-04", [2, 2]))).toBe(0);
  });
});

describe("weekendShare", () => {
  it("is 0 (not NaN) when there are no contributions", () => {
    expect(weekendShare([])).toBe(0);
  });

  it("is the share of contributions on Saturday and Sunday", () => {
    // 2026-01-03 Sat, 01-04 Sun, 01-05 Mon, 01-06 Tue
    expect(weekendShare(days("2026-01-03", [1, 1, 1, 1]))).toBe(0.5);
  });
});

describe("topRepo", () => {
  const entry = (name: string, totalCount: number) => ({
    repository: { nameWithOwner: name },
    contributions: { totalCount },
  });

  it("is null when there are no commits to any repo", () => {
    expect(topRepo([])).toBeNull();
  });

  it("returns the repo with the most commits", () => {
    expect(
      topRepo([entry("a/one", 3), entry("a/two", 10), entry("a/three", 7)]),
    ).toEqual({ name: "a/two", commits: 10 });
  });

  it("keeps the first repo on a tie", () => {
    expect(topRepo([entry("a/one", 5), entry("a/two", 5)])?.name).toBe("a/one");
  });
});

describe("hourHistogram and busiestHour", () => {
  it("counts pushes per hour in UTC", () => {
    const histogram = hourHistogram(
      ["2026-09-01T09:15:00Z", "2026-09-02T09:45:00Z", "2026-09-02T17:00:00Z"],
      "UTC",
    );
    expect(histogram).toHaveLength(24);
    expect(histogram[9]).toBe(2);
    expect(histogram[17]).toBe(1);
    expect(busiestHour(histogram)).toBe(9);
  });

  it("shifts hours into the viewer's timezone", () => {
    // 20:00 UTC is 01:30 the next day in India (UTC+5:30).
    const histogram = hourHistogram(["2026-09-01T20:00:00Z"], "Asia/Kolkata");
    expect(busiestHour(histogram)).toBe(1);
  });

  it("handles timezones behind UTC and daylight saving time", () => {
    // New York is UTC-4 in summer (EDT) and UTC-5 in winter (EST).
    expect(
      busiestHour(hourHistogram(["2026-07-01T03:00:00Z"], "America/New_York")),
    ).toBe(23);
    expect(
      busiestHour(hourHistogram(["2026-01-01T03:00:00Z"], "America/New_York")),
    ).toBe(22);
  });

  it("uses 0 for midnight, never 24", () => {
    expect(busiestHour(hourHistogram(["2026-09-01T00:30:00Z"], "UTC"))).toBe(0);
  });

  it("is null when there are no pushes", () => {
    expect(busiestHour(hourHistogram([], "UTC"))).toBeNull();
  });
});

describe("personality", () => {
  const base: PersonalityInput = {
    busiestHour: 14,
    weekendShare: 0.1,
    longestStreak: 3,
    languages: [lang("TypeScript", 100)],
  };

  it.each([
    [22, "Night Owl"],
    [23, "Night Owl"],
    [0, "Night Owl"],
    [3, "Night Owl"],
    [4, "Steady Builder"],
    [5, "Early Bird"],
    [8, "Early Bird"],
    [9, "Steady Builder"],
    [21, "Steady Builder"],
  ] as const)("busiest hour %i gives %s", (busiestHour, expected) => {
    expect(personality({ ...base, busiestHour })).toBe(expected);
  });

  it("is Weekend Warrior above 35% weekend contributions", () => {
    expect(personality({ ...base, weekendShare: 0.36 })).toBe(
      "Weekend Warrior",
    );
    expect(personality({ ...base, weekendShare: 0.35 })).toBe("Steady Builder");
  });

  it("is Streak Machine from a 30-day streak", () => {
    expect(personality({ ...base, longestStreak: 30 })).toBe("Streak Machine");
    expect(personality({ ...base, longestStreak: 29 })).toBe("Steady Builder");
  });

  it("is Polyglot with 5+ languages above 5% each", () => {
    const five = ["A", "B", "C", "D", "E"].map((n) => lang(n, 20));
    expect(personality({ ...base, languages: five })).toBe("Polyglot");

    const oneTiny = [...five.slice(0, 4), lang("E", 5)];
    expect(personality({ ...base, languages: oneTiny })).toBe("Steady Builder");
  });

  it("is Steady Builder for an empty user", () => {
    expect(
      personality({
        busiestHour: null,
        weekendShare: 0,
        longestStreak: 0,
        languages: [],
      }),
    ).toBe("Steady Builder");
  });

  it("uses the first matching rule", () => {
    const everything: PersonalityInput = {
      busiestHour: 23,
      weekendShare: 0.9,
      longestStreak: 100,
      languages: ["A", "B", "C", "D", "E"].map((n) => lang(n, 20)),
    };
    expect(personality(everything)).toBe("Night Owl");
    expect(personality({ ...everything, busiestHour: 14 })).toBe(
      "Weekend Warrior",
    );
    expect(
      personality({ ...everything, busiestHour: 14, weekendShare: 0 }),
    ).toBe("Streak Machine");
    expect(
      personality({
        ...everything,
        busiestHour: 14,
        weekendShare: 0,
        longestStreak: 0,
      }),
    ).toBe("Polyglot");
  });
});

describe("computeStats and personalityFor", () => {
  const user: GitHubUser = {
    login: "octo",
    name: "Octo Cat",
    avatarUrl: "https://example.com/octo.png",
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: 7,
        // Mon 5 Jan to Sun 11 Jan 2026
        weeks: [
          { contributionDays: days("2026-01-05", [2, 1, 1, 0, 1, 1, 1]) },
        ],
      },
      commitContributionsByRepository: [
        {
          repository: { nameWithOwner: "octo/app" },
          contributions: { totalCount: 4 },
        },
      ],
    },
    repositories: { nodes: [repo(["TypeScript", 3], ["CSS", 1])] },
  };

  it("puts every stat together", () => {
    const stats = computeStats({ user, pushTimes: ["2026-01-05T20:00:00Z"] });

    expect(stats).toMatchObject({
      login: "octo",
      totalContributions: 7,
      longestStreak: 3,
      currentStreak: 3,
      busiestWeekday: 1, // Monday
      weekendShare: 2 / 7,
      topRepo: { name: "octo/app", commits: 4 },
      pushTimes: ["2026-01-05T20:00:00Z"],
    });
    expect(stats.languages.map((l) => [l.name, l.percent])).toEqual([
      ["TypeScript", 75],
      ["CSS", 25],
    ]);
  });

  it("gives a different personality depending on the viewer's timezone", () => {
    const stats = computeStats({ user, pushTimes: ["2026-01-05T20:00:00Z"] });

    expect(personalityFor(stats, "UTC")).toBe("Steady Builder"); // 20:00
    expect(personalityFor(stats, "Asia/Kolkata")).toBe("Night Owl"); // 01:30
  });
});
