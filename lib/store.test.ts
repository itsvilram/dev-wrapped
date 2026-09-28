import { describe, expect, it } from "vitest";
import { memoryStore } from "./store";

function clock(start = 0) {
  let time = start;
  return { now: () => time, advance: (ms: number) => (time += ms) };
}

describe("memoryStore", () => {
  it("returns saved values until they expire", async () => {
    const c = clock();
    const store = memoryStore(c.now);
    await store.set("k", { a: 1 }, 10);

    expect(await store.get("k")).toEqual({ a: 1 });
    c.advance(10_000);
    expect(await store.get("k")).toBeNull();
  });

  it("returns a copy, so callers cannot change the saved value", async () => {
    const store = memoryStore();
    await store.set("k", { a: 1 }, 10);
    const copy = await store.get<{ a: number }>("k");
    copy!.a = 99;

    expect(await store.get("k")).toEqual({ a: 1 });
  });

  it("setIfAbsent lets exactly one caller win until the key expires", async () => {
    const c = clock();
    const store = memoryStore(c.now);

    expect(await store.setIfAbsent("lock", "a", 1000)).toBe(true);
    expect(await store.setIfAbsent("lock", "b", 1000)).toBe(false);
    c.advance(1000);
    expect(await store.setIfAbsent("lock", "b", 1000)).toBe(true);
  });

  it("deleteIfEquals only deletes a key that still holds our value", async () => {
    const store = memoryStore();
    await store.setIfAbsent("lock", "mine", 1000);

    await store.deleteIfEquals("lock", "someone-else");
    expect(await store.get("lock")).toBe("mine");
    await store.deleteIfEquals("lock", "mine");
    expect(await store.get("lock")).toBeNull();
  });

  it("increment counts up and keeps the first expiry", async () => {
    const c = clock();
    const store = memoryStore(c.now);

    expect(await store.increment("n", 10)).toBe(1);
    c.advance(5_000);
    expect(await store.increment("n", 10)).toBe(2);
    c.advance(5_000); // 10 s after the first increment
    expect(await store.increment("n", 10)).toBe(1);
  });
});
