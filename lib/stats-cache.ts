import {
  GitHubRequestError,
  RateLimitError,
  UserNotFoundError,
} from "./github";
import {
  TooManyRequestsError,
  checkRateLimit,
  type RateLimitRule,
} from "./rate-limit";
import type { KeyValueStore } from "./store";
import type { WrappedStats } from "./types";

// Bump when the WrappedStats shape changes, so old entries are ignored.
const VERSION = "v2";
const FRESH_MS = 60 * 60 * 1000; // serve without asking GitHub for 1 hour
const KEEP_SECONDS = 24 * 60 * 60; // keep a stale copy for 1 day as a backup
const NOT_FOUND_SECONDS = 10 * 60;
const LOCK_MS = 15_000; // longer than a slow GitHub call
const WAIT_STEP_MS = 250;
const WAIT_MAX_MS = 8_000;
// New (uncached) lookups per client per 10 minutes. Cache hits are free.
export const LOOKUP_LIMIT: RateLimitRule = { limit: 30, windowSeconds: 600 };

type Entry = { stats: WrappedStats; savedAt: number };

type Deps = {
  store: KeyValueStore;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  lockToken?: () => string;
};

// Wraps "fetch from GitHub and compute" with a shared cache:
// 1. fresh entry (< 1 hour)  -> return it, no GitHub call
// 2. "not found" remembered  -> throw straight away
// 3. otherwise take a lock so only ONE request calls GitHub for this key;
//    everyone else waits for its result (request coalescing)
// 4. if GitHub fails or the client is rate-limited, serve the stale copy
export function createStatsCache({
  store,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  lockToken = () => crypto.randomUUID(),
}: Deps) {
  async function readFresh(key: string): Promise<Entry | null> {
    const entry = await store.get<Entry>(key);
    return entry && now() - entry.savedAt < FRESH_MS ? entry : null;
  }

  return async function getStats(
    login: string,
    year: number | null,
    clientId: string,
    load: () => Promise<WrappedStats>,
  ): Promise<WrappedStats> {
    const id = `${login.toLowerCase()}:${year ?? "last12"}`;
    const key = `wrapped:${VERSION}:${id}`;
    const notFoundKey = `notfound:${login.toLowerCase()}`;
    const lockKey = `lock:${key}`;

    const entry = await store.get<Entry>(key);
    if (entry && now() - entry.savedAt < FRESH_MS) return entry.stats;
    if (await store.get(notFoundKey)) throw new UserNotFoundError(login);

    const token = lockToken();
    if (!(await store.setIfAbsent(lockKey, token, LOCK_MS))) {
      // Someone else is already asking GitHub for this user.
      if (entry) return entry.stats; // stale is fine while they refresh it
      for (let waited = 0; waited < WAIT_MAX_MS; waited += WAIT_STEP_MS) {
        await sleep(WAIT_STEP_MS);
        const fresh = await readFresh(key);
        if (fresh) return fresh.stats;
      }
      // They took too long (or failed): fall through and try ourselves.
    }

    try {
      await checkRateLimit(store, clientId, LOOKUP_LIMIT, now());
      const stats = await load();
      await store.set(
        key,
        { stats, savedAt: now() } satisfies Entry,
        KEEP_SECONDS,
      );
      return stats;
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        await store.set(notFoundKey, 1, NOT_FOUND_SECONDS);
        throw error;
      }
      // Rate limits and GitHub outages: an hour-old answer beats an error.
      const recoverable =
        error instanceof RateLimitError ||
        error instanceof GitHubRequestError ||
        error instanceof TooManyRequestsError;
      if (entry && recoverable) return entry.stats;
      throw error;
    } finally {
      await store.deleteIfEquals(lockKey, token);
    }
  };
}
