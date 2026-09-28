import { ImageResponse } from "next/og";
import { CARD_SIZE, ShareCard } from "@/components/ShareCard";
import { RateLimitError, UserNotFoundError } from "@/lib/github";
import { personalityFor } from "@/lib/stats";
import { validTimeZone } from "@/lib/format";
import { parseYear } from "@/lib/period";
import { getWrappedStats } from "@/lib/wrapped";

// Browsers and CDNs (Vercel) may keep the PNG for an hour, the same as our
// GitHub data cache, then serve the old one while a new one is made.
const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

// GET /api/card/torvalds?year=2025&tz=Asia/Kolkata -> 1200x630 PNG card.
// `year` is optional (default: the last 12 months).
// `tz` decides the busiest hour (and so the personality); link previews
// have no viewer timezone, so they fall back to UTC.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/card/[username]">,
) {
  const { username } = await params;
  const query = new URL(request.url).searchParams;
  const timeZone = validTimeZone(query.get("tz"));
  const year = parseYear(query.get("year"), new Date().getUTCFullYear());

  try {
    const stats = await getWrappedStats(username, year);
    return new ImageResponse(
      <ShareCard stats={stats} personality={personalityFor(stats, timeZone)} />,
      { ...CARD_SIZE, headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return new Response("User not found", { status: 404 });
    }
    if (error instanceof RateLimitError) {
      return new Response("GitHub rate limit reached, try again later", {
        status: 503,
        headers: { "Retry-After": "600" },
      });
    }
    throw error;
  }
}
