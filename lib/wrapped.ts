import "server-only";
import { cache } from "react";
import { getGitHubData } from "./github";
import { createStatsCache } from "./stats-cache";
import { computeStats } from "./stats";
import { getStore } from "./store";

let statsCache: ReturnType<typeof createStatsCache> | undefined;

// Stats for one user and period (year = null for the last 12 months).
// Two layers:
// - Redis (lib/stats-cache.ts): shared by all servers, with coalescing,
//   rate limiting per client and a stale copy for when GitHub fails.
// - React cache(): the page and generateMetadata share one call per request.
export const getWrappedStats = cache(
  async (username: string, year: number | null, clientId: string) => {
    statsCache ??= createStatsCache({ store: getStore() });
    // GitHub usernames are case-insensitive; lowercasing gives one cache entry.
    const login = username.toLowerCase();
    return statsCache(login, year, clientId, async () =>
      computeStats(await getGitHubData(login, year)),
    );
  },
);
