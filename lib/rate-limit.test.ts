import { describe, expect, it } from "vitest";
import {
  TooManyRequestsError,
  checkRateLimit,
  clientIdFrom,
} from "./rate-limit";
import { memoryStore } from "./store";

const rule = { limit: 3, windowSeconds: 60 };

describe("checkRateLimit", () => {
  it("allows up to the limit, then throws with seconds until the window ends", async () => {
    const store = memoryStore(() => 0);
    const now = 45_000; // 45 s into the first 60 s window

    for (let i = 0; i < 3; i++) await checkRateLimit(store, "ip", rule, now);
    const error = await checkRateLimit(store, "ip", rule, now).catch((e) => e);

    expect(error).toBeInstanceOf(TooManyRequestsError);
    expect(error.retryAfterSeconds).toBe(15);
  });

  it("counts each client separately", async () => {
    const store = memoryStore(() => 0);
    for (let i = 0; i < 3; i++) await checkRateLimit(store, "a", rule, 0);

    await expect(checkRateLimit(store, "b", rule, 0)).resolves.toBeUndefined();
  });

  it("starts again in the next window", async () => {
    const store = memoryStore(() => 0);
    for (let i = 0; i < 3; i++) await checkRateLimit(store, "ip", rule, 0);

    await expect(
      checkRateLimit(store, "ip", rule, 60_000),
    ).resolves.toBeUndefined();
  });
});

describe("clientIdFrom", () => {
  it("uses the first x-forwarded-for address", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIdFrom(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to one shared bucket", () => {
    expect(clientIdFrom(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
    expect(clientIdFrom(new Headers())).toBe("unknown");
  });
});
