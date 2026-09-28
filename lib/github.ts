import "server-only";
import type { GitHubData, GitHubUser } from "./types";
import { isPastYear, yearRange } from "./period";
import { isValidUsername } from "./username";

// End-to-end tests point this at a local fake GitHub (e2e/mock-github.mjs).
const API_URL = process.env.GITHUB_API_URL ?? "https://api.github.com";
const CACHE_SECONDS = 60 * 60;
// The public events API returns at most 300 events: 3 pages of 100.
const EVENT_PAGES = 3;
const EVENTS_PER_PAGE = 100;

export class UserNotFoundError extends Error {}
export class RateLimitError extends Error {}
export class GitHubRequestError extends Error {}

const USER_QUERY = /* GraphQL */ `
  # from/to = null means GitHub's default: the last 12 months.
  query ($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      login
      name
      avatarUrl
      createdAt
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
        commitContributionsByRepository {
          repository {
            nameWithOwner
          }
          contributions {
            totalCount
          }
        }
      }
      # Most-starred first, so the 100 repos we read are the ones that matter.
      repositories(
        ownerAffiliations: OWNER
        isFork: false
        first: 100
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          stargazerCount
          languages(first: 10) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

type GraphQLResponse = {
  data?: { user: GitHubUser | null };
  errors?: { type?: string; message: string }[];
};

type PublicEvent = { type: string; created_at: string };

// year = null for the last 12 months, or a calendar year like 2025.
export async function getGitHubData(
  login: string,
  year: number | null,
): Promise<GitHubData> {
  if (!isValidUsername(login)) throw new UserNotFoundError(login);
  const currentYear = new Date().getUTCFullYear();
  const pastYear = isPastYear(year, currentYear);
  const range = year === null ? null : yearRange(year);

  const [user, pushTimes] = await Promise.all([
    fetchUser(login, range),
    // Events only go back ~30 days, so a past year has none: skip the calls.
    pastYear ? null : fetchPushTimes(login),
  ]);
  // In early January the last 30 days include last December; drop those.
  // (ISO timestamps in UTC compare correctly as plain strings.)
  const inRange =
    pushTimes && range ? pushTimes.filter((t) => t >= range.from) : pushTimes;

  return {
    user,
    pushTimes: inRange,
    year,
    currentYear,
  };
}

async function fetchUser(
  login: string,
  range: { from: string; to: string } | null,
): Promise<GitHubUser> {
  const res = await request("/graphql", {
    query: USER_QUERY,
    variables: { login, from: range?.from ?? null, to: range?.to ?? null },
  });
  const { data, errors = [] } = (await res.json()) as GraphQLResponse;

  if (errors.some((e) => e.type === "RATE_LIMITED")) {
    throw new RateLimitError("GitHub GraphQL rate limit reached");
  }
  if (data?.user) return data.user;
  if (errors.length === 0 || errors.some((e) => e.type === "NOT_FOUND")) {
    throw new UserNotFoundError(login);
  }
  throw new GitHubRequestError(errors[0].message);
}

async function fetchPushTimes(login: string): Promise<string[]> {
  const times: string[] = [];
  for (let page = 1; page <= EVENT_PAGES; page++) {
    const res = await request(
      `/users/${login}/events/public?per_page=${EVENTS_PER_PAGE}&page=${page}`,
    );
    const events = (await res.json()) as PublicEvent[];
    for (const event of events) {
      if (event.type === "PushEvent") times.push(event.created_at);
    }
    if (events.length < EVENTS_PER_PAGE) break; // last page
  }
  return times;
}

// Sends a GET (or a POST when there is a body) to GitHub and turns
// failed responses into our own error types.
async function request(path: string, body?: unknown): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set. Copy .env.example to .env.local.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: body ? "POST" : "GET",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: CACHE_SECONDS },
    });
  } catch (cause) {
    throw new GitHubRequestError("Could not reach GitHub", { cause });
  }

  if (isRateLimited(res)) throw new RateLimitError("GitHub rate limit reached");
  if (res.status === 404) throw new UserNotFoundError("GitHub returned 404");
  if (!res.ok) {
    throw new GitHubRequestError(`GitHub responded with ${res.status}`);
  }
  return res;
}

function isRateLimited(res: Response): boolean {
  return (
    res.status === 429 ||
    (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")
  );
}
