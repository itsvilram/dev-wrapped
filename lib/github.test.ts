import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GitHubRequestError,
  RateLimitError,
  UserNotFoundError,
  getGitHubData,
} from "./github";

const user = { login: "octo", name: "Octo Cat", avatarUrl: "https://x/y.png" };

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), init);
}

// Answers GraphQL with `graphql` and every events page with `events`.
function mockGitHub(graphql: Response, events: () => Response) {
  const fetchMock = vi.fn(async (url: string) =>
    url.endsWith("/graphql") ? graphql : events(),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => vi.stubEnv("GITHUB_TOKEN", "test-token"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getGitHubData", () => {
  it("returns the user and only PushEvent timestamps", async () => {
    mockGitHub(json({ data: { user } }), () =>
      json([
        { type: "PushEvent", created_at: "2026-09-01T22:10:00Z" },
        { type: "WatchEvent", created_at: "2026-09-01T10:00:00Z" },
      ]),
    );

    const data = await getGitHubData("octo", null);

    expect(data.user.login).toBe("octo");
    expect(data.pushTimes).toEqual(["2026-09-01T22:10:00Z"]);
  });

  it("stops at 3 pages of events", async () => {
    const fullPage = Array.from({ length: 100 }, () => ({
      type: "PushEvent",
      created_at: "2026-09-01T10:00:00Z",
    }));
    const fetchMock = mockGitHub(json({ data: { user } }), () =>
      json(fullPage),
    );

    const data = await getGitHubData("octo", null);

    expect(data.pushTimes).toHaveLength(300);
    expect(fetchMock).toHaveBeenCalledTimes(4); // 1 GraphQL + 3 event pages
  });

  it("sends the token only in the Authorization header", async () => {
    const fetchMock = mockGitHub(json({ data: { user } }), () => json([]));

    await getGitHubData("octo", null);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).not.toContain("test-token");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-token" });
  });

  it("throws UserNotFoundError for an unknown user", async () => {
    mockGitHub(
      json({
        data: { user: null },
        errors: [{ type: "NOT_FOUND", message: "x" }],
      }),
      () => json({}, { status: 404 }),
    );

    await expect(getGitHubData("ghost", null)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it("throws UserNotFoundError for an invalid username without calling GitHub", async () => {
    const fetchMock = mockGitHub(json({}), () => json([]));

    await expect(getGitHubData("../admin", null)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws RateLimitError when the REST limit is used up", async () => {
    mockGitHub(json({ data: { user } }), () =>
      json({}, { status: 403, headers: { "x-ratelimit-remaining": "0" } }),
    );

    await expect(getGitHubData("octo", null)).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("throws RateLimitError when GraphQL reports RATE_LIMITED", async () => {
    mockGitHub(
      json({ errors: [{ type: "RATE_LIMITED", message: "slow down" }] }),
      () => json([]),
    );

    await expect(getGitHubData("octo", null)).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("throws GitHubRequestError when the network fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(getGitHubData("octo", null)).rejects.toBeInstanceOf(
      GitHubRequestError,
    );
  });

  it("throws GitHubRequestError for a server error", async () => {
    mockGitHub(json({}, { status: 502 }), () => json([]));

    await expect(getGitHubData("octo", null)).rejects.toBeInstanceOf(
      GitHubRequestError,
    );
  });
});

describe("getGitHubData with a year", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-05T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  function graphqlVariables(fetchMock: ReturnType<typeof mockGitHub>) {
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    return JSON.parse(init.body as string).variables;
  }

  it("asks GraphQL for the last 12 months when there is no year", async () => {
    const fetchMock = mockGitHub(json({ data: { user } }), () => json([]));

    await getGitHubData("octo", null);

    expect(graphqlVariables(fetchMock)).toEqual({
      login: "octo",
      from: null,
      to: null,
    });
  });

  it("asks for the whole calendar year and skips events for a past year", async () => {
    const fetchMock = mockGitHub(json({ data: { user } }), () => json([]));

    const data = await getGitHubData("octo", 2024);

    expect(graphqlVariables(fetchMock)).toEqual({
      login: "octo",
      from: "2024-01-01T00:00:00Z",
      to: "2024-12-31T23:59:59Z",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1); // GraphQL only, no events API
    expect(data).toMatchObject({
      pushTimes: null,
      year: 2024,
      currentYear: 2026,
    });
  });

  it("keeps only this year's pushes for the current year", async () => {
    mockGitHub(json({ data: { user } }), () =>
      json([
        { type: "PushEvent", created_at: "2026-01-02T09:00:00Z" },
        { type: "PushEvent", created_at: "2025-12-30T09:00:00Z" },
      ]),
    );

    const data = await getGitHubData("octo", 2026);

    expect(data.pushTimes).toEqual(["2026-01-02T09:00:00Z"]);
    expect(data.currentYear).toBe(2026);
  });
});
