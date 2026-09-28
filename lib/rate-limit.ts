import type { KeyValueStore } from "./store";

export class TooManyRequestsError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many new lookups from this address");
  }
}

export type RateLimitRule = { limit: number; windowSeconds: number };

// Fixed-window counter: one Redis key per client per window, e.g.
// "ratelimit:203.0.113.7:2926501". INCR it; the first INCR also sets the
// expiry, so old windows clean themselves up. Throws when over the limit.
export async function checkRateLimit(
  store: KeyValueStore,
  clientId: string,
  { limit, windowSeconds }: RateLimitRule,
  now: number = Date.now(),
): Promise<void> {
  const windowIndex = Math.floor(now / 1000 / windowSeconds);
  const count = await store.increment(
    `ratelimit:${clientId}:${windowIndex}`,
    windowSeconds,
  );
  if (count > limit) {
    const windowEnd = (windowIndex + 1) * windowSeconds;
    throw new TooManyRequestsError(Math.ceil(windowEnd - now / 1000));
  }
}

// The caller's IP address. On Vercel the first entry of x-forwarded-for
// is the real client; anything we cannot read shares one "unknown" bucket.
export function clientIdFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
