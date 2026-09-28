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
    contributionCalendar: {
      totalContributions: number;
      weeks: { contributionDays: ContributionDay[] }[];
    };
    commitContributionsByRepository: RepoContribution[];
  };
  repositories: {
    nodes: { languages: { edges: LanguageEdge[] } }[];
  };
};

export type GitHubData = {
  user: GitHubUser;
  pushTimes: string[]; // ISO timestamps in UTC, e.g. "2026-03-14T21:05:00Z"
};
