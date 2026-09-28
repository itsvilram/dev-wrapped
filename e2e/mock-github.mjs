// A tiny fake GitHub API for the Playwright tests, so they never call the
// real GitHub. Start: node e2e/mock-github.mjs (playwright.config.ts does it).
//
// Users:
//   octocat   - normal user (the happy path)
//   quietcat  - no public activity
//   busycat   - GitHub rate limit reached
//   anyone else - not found
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 4010);
const DAYS = 364;
const LAST_DAY = Date.UTC(2026, 8, 27); // 27 Sep 2026

// A 1x1 purple PNG, inline, so tests do not download a real avatar.
const AVATAR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==";

// Contribution calendar: all zeros except a 20-day run (3 a day) in the
// middle and a 12-day run (5 a day) ending today.
// Total = 20 * 3 + 12 * 5 = 120, longest streak 20, current streak 12.
function calendar(active) {
  const days = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(LAST_DAY - (DAYS - 1 - i) * 86_400_000);
    let count = 0;
    if (active && i >= 150 && i < 170) count = 3;
    if (active && i >= DAYS - 12) count = 5;
    return {
      date: date.toISOString().slice(0, 10),
      contributionCount: count,
      weekday: date.getUTCDay(),
    };
  });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push({ contributionDays: days.slice(i, i + 7) });
  }
  const total = days.reduce((sum, d) => sum + d.contributionCount, 0);
  return { totalContributions: total, weeks };
}

function user(login, name, active) {
  const language = (name, size, color) => ({ size, node: { name, color } });
  return {
    login,
    name,
    avatarUrl: AVATAR,
    contributionsCollection: {
      // By type; these add up to the calendar total of 120.
      totalCommitContributions: active ? 95 : 0,
      totalPullRequestContributions: active ? 14 : 0,
      totalPullRequestReviewContributions: active ? 8 : 0,
      totalIssueContributions: active ? 3 : 0,
      contributionCalendar: calendar(active),
      commitContributionsByRepository: active
        ? [
            {
              repository: { nameWithOwner: "octocat/spoon-knife" },
              contributions: { totalCount: 7 },
            },
            {
              repository: { nameWithOwner: "octocat/hello-world" },
              contributions: { totalCount: 42 },
            },
          ]
        : [],
    },
    repositories: {
      nodes: active
        ? [
            {
              stargazerCount: 1200,
              languages: {
                edges: [
                  language("TypeScript", 6000, "#3178c6"),
                  language("CSS", 2000, "#663399"),
                ],
              },
            },
            {
              stargazerCount: 34,
              languages: { edges: [language("HTML", 2000, "#e34c26")] },
            },
          ]
        : [],
    },
  };
}

// 17:40 UTC is 23:10 in India, so an Indian viewer sees 23:00 as the
// busiest hour and the personality "Night Owl".
const OCTOCAT_EVENTS = [
  ...Array.from({ length: 5 }, (_, i) => ({
    type: "PushEvent",
    created_at: `2026-09-2${i}T17:40:00Z`,
  })),
  { type: "PushEvent", created_at: "2026-09-20T04:00:00Z" },
  { type: "WatchEvent", created_at: "2026-09-21T04:00:00Z" },
];

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

const RATE_LIMITED = { "x-ratelimit-remaining": "0" };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/health") return send(res, 200, { ok: true });

  if (req.method === "POST" && url.pathname === "/graphql") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { login } = JSON.parse(body).variables;
    if (login === "octocat")
      return send(res, 200, {
        data: { user: user("octocat", "The Octocat", true) },
      });
    if (login === "quietcat")
      return send(res, 200, {
        data: { user: user("quietcat", "Quiet Cat", false) },
      });
    if (login === "busycat")
      return send(res, 200, {
        errors: [{ type: "RATE_LIMITED", message: "API rate limit exceeded" }],
      });
    return send(res, 200, {
      data: { user: null },
      errors: [{ type: "NOT_FOUND", message: "Not found" }],
    });
  }

  const events = url.pathname.match(/^\/users\/([^/]+)\/events\/public$/);
  if (events) {
    const login = events[1];
    if (login === "octocat")
      return send(
        res,
        200,
        url.searchParams.get("page") === "1" ? OCTOCAT_EVENTS : [],
      );
    if (login === "quietcat") return send(res, 200, []);
    if (login === "busycat")
      return send(
        res,
        403,
        { message: "API rate limit exceeded" },
        RATE_LIMITED,
      );
    return send(res, 404, { message: "Not Found" });
  }

  send(res, 404, { message: "Not Found" });
}).listen(PORT, () => console.log(`Mock GitHub on http://localhost:${PORT}`));
