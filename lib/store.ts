import { Redis } from "@upstash/redis";

// The few key-value operations the app needs. Two implementations:
// Redis (shared by every server instance, used in production) and an
// in-memory Map (one process only, used locally and in tests).
export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  // SET key value NX PX ttl: true only for the caller that created the key.
  // This is what makes a lock: exactly one caller can win.
  setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean>;
  // Deletes the key only if it still holds `value`, so a lock is never
  // released by someone who does not own it any more.
  deleteIfEquals(key: string, value: string): Promise<void>;
  // INCR, and set the expiry when the counter is created. Returns the count.
  increment(key: string, ttlSeconds: number): Promise<number>;
}

// Runs GET + compare + DEL as one step inside Redis, so nothing can change
// the key between the check and the delete.
const DELETE_IF_EQUALS = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0`;

export function redisStore(redis: Redis): KeyValueStore {
  return {
    get: (key) => redis.get(key),
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    async setIfAbsent(key, value, ttlMs) {
      return (await redis.set(key, value, { nx: true, px: ttlMs })) === "OK";
    },
    async deleteIfEquals(key, value) {
      await redis.eval(DELETE_IF_EQUALS, [key], [value]);
    },
    async increment(key, ttlSeconds) {
      // MULTI/EXEC: both commands run together, in order.
      const [count] = await redis
        .multi()
        .incr(key)
        .expire(key, ttlSeconds, "NX")
        .exec<[number, number]>();
      return count;
    },
  };
}

// Same behaviour as Redis, in this process's memory. `now` is injectable so
// tests can move time forward.
export function memoryStore(now: () => number = Date.now): KeyValueStore {
  const data = new Map<string, { value: unknown; expiresAt: number }>();

  function read(key: string) {
    const entry = data.get(key);
    if (entry && entry.expiresAt <= now()) {
      data.delete(key);
      return undefined;
    }
    return entry;
  }

  return {
    async get<T>(key: string) {
      const entry = read(key);
      // Copy, like a real store: callers can't change what is saved.
      return entry ? (structuredClone(entry.value) as T) : null;
    },
    async set(key, value, ttlSeconds) {
      data.set(key, {
        value: structuredClone(value),
        expiresAt: now() + ttlSeconds * 1000,
      });
    },
    async setIfAbsent(key, value, ttlMs) {
      if (read(key)) return false;
      data.set(key, { value, expiresAt: now() + ttlMs });
      return true;
    },
    async deleteIfEquals(key, value) {
      if (read(key)?.value === value) data.delete(key);
    },
    async increment(key, ttlSeconds) {
      const entry = read(key);
      const count = ((entry?.value as number) ?? 0) + 1;
      data.set(key, {
        value: count,
        expiresAt: entry?.expiresAt ?? now() + ttlSeconds * 1000,
      });
      return count;
    },
  };
}

let shared: KeyValueStore | undefined;

// Redis when UPSTASH_REDIS_REST_URL/TOKEN are set, otherwise memory.
export function getStore(): KeyValueStore {
  if (!shared) {
    const hasRedis =
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!hasRedis) {
      console.warn(
        "Upstash Redis is not configured; using an in-memory store.",
      );
    }
    shared = hasRedis ? redisStore(Redis.fromEnv()) : memoryStore();
  }
  return shared;
}
