// Shapes of the raw data we get back from the GitHub APIs.

export type ContributionDay = {
  date: string; // "2026-03-14"
  contributionCount: number;
  weekday: number; // 0 = Sunday ... 6 = Saturday
};

export type LanguageEdge = {
  size: number; // bytes of code in this language
  node: { name: string; color: string | null };
};

export type RepoContribution = {
  repository: { nameWithOwner: string };
  contributions: { totalCount: number };
};

export type GitHubUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  contributionsCollection: {
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    totalIssueContributions: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: { contributionDays: ContributionDay[] }[];
    };
    commitContributionsByRepository: RepoContribution[];
  };
  repositories: {
    nodes: { stargazerCount: number; languages: { edges: LanguageEdge[] } }[];
  };
};

export type GitHubData = {
  user: GitHubUser;
  pushTimes: string[]; // ISO timestamps in UTC, e.g. "2026-03-14T21:05:00Z"
};

// Shapes of the numbers we compute from that data (see lib/stats.ts).

export type LanguageShare = {
  name: string;
  color: string | null;
  bytes: number;
  percent: number; // 0-100
};

export type Personality =
  | "Night Owl"
  | "Early Bird"
  | "Weekend Warrior"
  | "Streak Machine"
  | "Polyglot"
  | "Steady Builder";

// Contributions by type in the period (what the calendar total is made of).
export type Activity = {
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
};

export type WrappedStats = {
  login: string;
  name: string | null;
  avatarUrl: string;
  totalContributions: number;
  languages: LanguageShare[]; // every language, biggest first
  busiestWeekday: number | null; // 0 = Sunday, null when there are no contributions
  weekendShare: number; // 0-1
  longestStreak: number;
  currentStreak: number;
  topRepo: { name: string; commits: number } | null;
  activity: Activity;
  stars: number; // stars on the user's own public repos (all time)
  // Kept raw: the hour depends on the viewer's timezone, so it is
  // worked out later with hourHistogram().
  pushTimes: string[];
};
