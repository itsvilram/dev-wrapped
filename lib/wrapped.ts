import "server-only";
import { cache } from "react";
import { getGitHubData } from "./github";
import { computeStats } from "./stats";

// Fetches and computes everything for one user and period (year = null for
// the last 12 months). React's cache() makes sure the page and
// generateMetadata share one call within the same request.
export const getWrappedStats = cache(
  async (username: string, year: number | null) =>
    // GitHub usernames are case-insensitive; lowercasing gives one cache entry.
    computeStats(await getGitHubData(username.toLowerCase(), year)),
);
