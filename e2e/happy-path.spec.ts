import { expect, test, type Page } from "@playwright/test";

// Data comes from e2e/mock-github.mjs; the browser timezone is Asia/Kolkata
// (see playwright.config.ts).

async function expectSlide(page: Page, label: string) {
  await expect(
    page.getByText(new RegExp(`^Slide \\d+ of \\d+: ${label}$`)),
  ).toBeAttached();
}

test("enter a username and go through the whole story", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Enter a GitHub username").fill("octocat");
  await page.getByRole("button", { name: "Go" }).click();

  await expect(page).toHaveURL(/\/octocat$/);
  await expectSlide(page, "Intro");
  await expect(
    page.getByRole("heading", { name: "The Octocat" }),
  ).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expectSlide(page, "Total contributions");
  await expect(page.getByText("120", { exact: true })).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expectSlide(page, "Beyond the total");
  await expect(page.getByText("95", { exact: true })).toBeVisible();
  await expect(page.getByText("pull requests")).toBeVisible();
  await expect(page.getByText("1,234")).toBeVisible(); // stars: 1200 + 34

  await page.keyboard.press(" "); // Space also moves forward
  await expectSlide(page, "Top languages");
  await expect(page.getByText("1. TypeScript")).toBeVisible();
  await expect(page.getByText("60%")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expectSlide(page, "Busiest hour and day");
  await expect(page.getByText("23:00")).toBeVisible();
  await expect(
    page.getByText(/in your timezone \(Asia\/(Kolkata|Calcutta)\)/),
  ).toBeVisible();

  // Tapping the left side goes back, the right side goes forward.
  await page.getByText("was your busiest hour").click();
  await expectSlide(page, "Streaks");
  await page.keyboard.press("ArrowLeft");
  await expectSlide(page, "Busiest hour and day");
  await page.keyboard.press("ArrowRight");

  await expectSlide(page, "Streaks");
  await expect(page.getByText("20", { exact: true })).toBeVisible();
  await expect(page.getByText("12", { exact: true })).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expectSlide(page, "Most-contributed repo");
  await expect(
    page.getByRole("link", { name: "octocat/hello-world" }),
  ).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expectSlide(page, "Coder personality");
  await expect(page.getByText("Night Owl")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expectSlide(page, "Summary");
  const download = page.getByRole("link", { name: "Download" });
  await expect(download).toHaveAttribute(
    "href",
    /^\/api\/card\/octocat\?tz=Asia%2F/,
  );
  await expect(page.getByRole("button", { name: "Next slide" })).toBeDisabled();
});

test("the share card is a 1200x630 PNG", async ({ request }) => {
  const response = await request.get("/api/card/octocat?tz=Asia/Kolkata");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  const png = await response.body();
  // A PNG stores its width and height at bytes 16-23.
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test("shows a friendly page for an unknown user", async ({ page }) => {
  await page.goto("/ghost-user");
  await expect(
    page.getByRole("heading", { name: "We couldn't find that GitHub user" }),
  ).toBeVisible();
});

test("shows a quiet-year story for a user with no activity", async ({
  page,
}) => {
  // Wait until the page has loaded its JavaScript (hydrated), otherwise
  // the key press can happen before the keyboard handler exists.
  await page.goto("/quietcat", { waitUntil: "networkidle" });
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("A quiet year on GitHub")).toBeVisible();
});

test("explains when the GitHub rate limit is hit", async ({ page }) => {
  await page.goto("/busycat");
  await expect(
    page.getByRole("heading", { name: "GitHub needs a short break" }),
  ).toBeVisible();
});
