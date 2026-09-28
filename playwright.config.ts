import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const MOCK_PORT = 4010;

// Runs the production build (run `npm run build` first) against a fake
// GitHub API, so the tests are fast, stable and never hit the real GitHub.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    timezoneId: "Asia/Kolkata",
    trace: "retain-on-failure",
  },
  // Mobile first: people open and share this from their phones.
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: [
    {
      command: "node e2e/mock-github.mjs",
      url: `http://localhost:${MOCK_PORT}/health`,
      env: { MOCK_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      env: {
        GITHUB_API_URL: `http://localhost:${MOCK_PORT}`,
        GITHUB_TOKEN: "test-token",
        // Empty values override .env.local, so tests always use the
        // in-memory store and never write fake data into the real Redis.
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "",
      },
      reuseExistingServer: false,
    },
  ],
});
