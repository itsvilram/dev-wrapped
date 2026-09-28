import { describe, expect, it, vi } from "vitest";
import {
  GitHubRequestError,
  RateLimitError,
  UserNotFoundError,
} from "./github";
import { TooManyRequestsError } from "./rate-limit";
import { LOOKUP_LIMIT, createStatsCache } from "./stats-cache";
import { memoryStore } from "./store";
import type { WrappedStats } from "./types";

const HOUR = 60 * 60 * 1000;

function fakeStats(totalContributions: number) {
  return { login: "octo", totalContributions } as WrappedStats;
}

function setup() {
  let time = 1_000_000;
  const store = memoryStore(() => time);
  const getStats = createStatsCache({
    store,
    now: () => time,
    sleep: async (ms) => {
      time += ms;
      await new Promise((resolve) => setTimeout(resolve, 0)); // let others run
    },
  });
  return { store, getStats, advance: (ms: number) => (time += ms) };
}

describe("createStatsCache", () => {
  it("calls GitHub once, then serves the cache for an hour", async () => {
    const { getStats, advance } = setup();
    const load = vi.fn(async () => fakeStats(10));

    await getStats("octo", null, "ip", load);
    advance(HOUR - 1);
    const second = await getStats("OCTO", null, "ip", load); // same user

    expect(second.totalContributions).toBe(10);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("asks GitHub again after an hour", async () => {
    const { getStats, advance } = setup();
    const load = vi
      .fn()
      .mockResolvedValueOnce(fakeStats(10))
      .mockResolvedValueOnce(fakeStats(11));

    await getStats("octo", null, "ip", load);
    advance(HOUR);

    expect((await getStats("octo", null, "ip", load)).totalContributions).toBe(
      11,
    );
  });

  it("keeps each year separate", async () => {
    const { getStats } = setup();
    const load = vi.fn(async () => fakeStats(1));

    await getStats("octo", null, "ip", load);
    await getStats("octo", 2024, "ip", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("makes one GitHub call for many simultaneous requests (coalescing)", async () => {
    const { getStats } = setup();
    let finish!: (stats: WrappedStats) => void;
    const load = vi.fn(
      () => new Promise<WrappedStats>((resolve) => (finish = resolve)),
    );

    const requests = Array.from({ length: 10 }, () =>
      getStats("octo", null, "ip", load),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    finish(fakeStats(42));
    const results = await Promise.all(requests);

    expect(load).toHaveBeenCalledTimes(1);
    expect(results.every((s) => s.totalContributions === 42)).toBe(true);
  });

  it.each([
    ["GitHub rate limit", new RateLimitError()],
    ["GitHub outage", new GitHubRequestError()],
  ])("serves the stale copy during a %s", async (_, error) => {
    const { getStats, advance } = setup();
    await getStats("octo", null, "ip", async () => fakeStats(10));
    advance(2 * HOUR);

    const stats = await getStats("octo", null, "ip", () =>
      Promise.reject(error),
    );

    expect(stats.totalContributions).toBe(10);
  });

  it("throws when GitHub fails and there is no copy at all", async () => {
    const { getStats } = setup();
    const failing = () => Promise.reject(new GitHubRequestError());

    await expect(getStats("octo", null, "ip", failing)).rejects.toBeInstanceOf(
      GitHubRequestError,
    );
  });

  it("remembers unknown users for 10 minutes", async () => {
    const { getStats, advance } = setup();
    const load = vi.fn(() => Promise.reject(new UserNotFoundError()));

    await expect(getStats("ghost", null, "ip", load)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    await expect(getStats("ghost", 2024, "ip", load)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(load).toHaveBeenCalledTimes(1);

    advance(10 * 60 * 1000);
    await getStats("ghost", null, "ip", load).catch(() => {});
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("rate-limits new lookups per client, but never cache hits", async () => {
    const { getStats } = setup();
    const load = vi.fn(async () => fakeStats(1));

    for (let i = 0; i < LOOKUP_LIMIT.limit; i++) {
      await getStats(`user${i}`, null, "ip", load);
    }
    await expect(getStats("one-more", null, "ip", load)).rejects.toBeInstanceOf(
      TooManyRequestsError,
    );
    // Already cached: still allowed, and costs GitHub nothing.
    await expect(getStats("user0", null, "ip", load)).resolves.toBeTruthy();
    // A different client has its own budget.
    await expect(
      getStats("one-more", null, "other-ip", load),
    ).resolves.toBeTruthy();
  });

  it("releases the lock when GitHub fails, so the next request can retry", async () => {
    const { getStats } = setup();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new GitHubRequestError())
      .mockResolvedValueOnce(fakeStats(5));

    await getStats("octo", null, "ip", load).catch(() => {});
    const stats = await getStats("octo", null, "ip", load);

    expect(stats.totalContributions).toBe(5);
  });
});
