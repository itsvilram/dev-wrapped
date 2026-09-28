// Pure functions: raw GitHub data in, numbers out. No fetching, no clock,
// no randomness, so the same input always gives the same result.
import type {
  ContributionDay,
  GitHubData,
  GitHubUser,
  LanguageShare,
  Personality,
  RepoContribution,
  WrappedStats,
} from "./types";

const SATURDAY = 6;
const SUNDAY = 0;

export function computeStats({ user, pushTimes }: GitHubData): WrappedStats {
  const { contributionCalendar, commitContributionsByRepository } =
    user.contributionsCollection;
  const days = flattenDays(contributionCalendar.weeks);

  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    totalContributions: contributionCalendar.totalContributions,
    languages: languageShares(user.repositories.nodes),
    busiestWeekday: busiestWeekday(days),
    weekendShare: weekendShare(days),
    longestStreak: longestStreak(days),
    currentStreak: currentStreak(days),
    topRepo: topRepo(commitContributionsByRepository),
    pushTimes,
  };
}

export function flattenDays(
  weeks: { contributionDays: ContributionDay[] }[],
): ContributionDay[] {
  return weeks.flatMap((week) => week.contributionDays);
}

// Most days in a row with at least one contribution.
export function longestStreak(days: ContributionDay[]): number {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}

// Days in a row up to today (the last day of the calendar). If today has
// no contributions yet, the streak still counts from yesterday, because
// the day is not over.
export function currentStreak(days: ContributionDay[]): number {
  let end = days.length - 1;
  if (end >= 0 && days[end].contributionCount === 0) end--;

  let streak = 0;
  for (let i = end; i >= 0 && days[i].contributionCount > 0; i--) streak++;
  return streak;
}

// Adds up bytes per language across all repos, biggest first.
export function languageShares(
  repos: GitHubUser["repositories"]["nodes"],
): LanguageShare[] {
  const byName = new Map<string, { color: string | null; bytes: number }>();
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      const current = byName.get(node.name);
      byName.set(node.name, {
        color: node.color,
        bytes: (current?.bytes ?? 0) + size,
      });
    }
  }

  const totalBytes = [...byName.values()].reduce((sum, l) => sum + l.bytes, 0);
  return [...byName.entries()]
    .map(([name, { color, bytes }]) => ({
      name,
      color,
      bytes,
      percent: (bytes / totalBytes) * 100,
    }))
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
}

// Contributions per weekday; returns the weekday (0 = Sunday) with the most.
export function busiestWeekday(days: ContributionDay[]): number | null {
  const totals = new Array<number>(7).fill(0);
  for (const day of days) totals[day.weekday] += day.contributionCount;
  return indexOfMax(totals);
}

// Share (0-1) of contributions made on Saturday or Sunday.
export function weekendShare(days: ContributionDay[]): number {
  let total = 0;
  let weekend = 0;
  for (const day of days) {
    total += day.contributionCount;
    if (day.weekday === SATURDAY || day.weekday === SUNDAY) {
      weekend += day.contributionCount;
    }
  }
  return total === 0 ? 0 : weekend / total;
}

export function topRepo(repos: RepoContribution[]): WrappedStats["topRepo"] {
  let best: WrappedStats["topRepo"] = null;
  for (const { repository, contributions } of repos) {
    if (!best || contributions.totalCount > best.commits) {
      best = {
        name: repository.nameWithOwner,
        commits: contributions.totalCount,
      };
    }
  }
  return best;
}

// Counts pushes per hour (0-23) in the given IANA timezone, e.g. "Asia/Kolkata".
// GitHub timestamps are UTC, so the same push can land on a different hour
// (or day) depending on where the viewer is.
export function hourHistogram(
  timestamps: string[],
  timeZone: string,
): number[] {
  const format = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  });
  const counts = new Array<number>(24).fill(0);
  for (const timestamp of timestamps) {
    counts[Number(format.format(new Date(timestamp)))]++;
  }
  return counts;
}

export function busiestHour(histogram: number[]): number | null {
  return indexOfMax(histogram);
}

export type PersonalityInput = {
  busiestHour: number | null;
  weekendShare: number;
  longestStreak: number;
  languages: LanguageShare[];
};

// The first rule that matches wins, so the order below matters.
export function personality(input: PersonalityInput): Personality {
  const hour = input.busiestHour;
  if (hour !== null && (hour >= 22 || hour < 4)) return "Night Owl";
  if (hour !== null && hour >= 5 && hour < 9) return "Early Bird";
  if (input.weekendShare > 0.35) return "Weekend Warrior";
  if (input.longestStreak >= 30) return "Streak Machine";
  if (input.languages.filter((l) => l.percent > 5).length >= 5) {
    return "Polyglot";
  }
  return "Steady Builder";
}

// Personality for a viewer in `timeZone`; the hour rules depend on it.
export function personalityFor(
  stats: WrappedStats,
  timeZone: string,
): Personality {
  return personality({
    busiestHour: busiestHour(hourHistogram(stats.pushTimes, timeZone)),
    weekendShare: stats.weekendShare,
    longestStreak: stats.longestStreak,
    languages: stats.languages,
  });
}

// Index of the largest value; the earliest index wins a tie.
// Returns null when every value is 0 (nothing to pick).
function indexOfMax(values: number[]): number | null {
  let best: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > 0 && (best === null || values[i] > values[best])) best = i;
  }
  return best;
}
