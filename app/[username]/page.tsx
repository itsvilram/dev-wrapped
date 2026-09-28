import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CARD_SIZE } from "@/components/ShareCard";
import { StatusScreen, secondaryButtonClass } from "@/components/StatusScreen";
import { Story } from "@/components/Story";
import { formatNumber } from "@/lib/format";
import { RateLimitError, UserNotFoundError } from "@/lib/github";
import { cardPath } from "@/lib/links";
import { parseYear, periodLabel } from "@/lib/period";
import type { WrappedStats } from "@/lib/types";
import { getWrappedStats } from "@/lib/wrapped";

type Props = PageProps<"/[username]">;

// "?year=2025" -> 2025; missing or invalid -> null (the last 12 months).
async function readYear(searchParams: Props["searchParams"]) {
  const { year } = await searchParams;
  return parseYear(year, new Date().getUTCFullYear());
}

// Tags that make the link preview nicely on LinkedIn, WhatsApp, X, etc.
// getWrappedStats is wrapped in cache(), so this does not fetch twice.
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { username } = await params;
  const year = await readYear(searchParams);
  const stats = await getWrappedStats(username, year).catch(() => null);
  if (!stats) return { title: "Dev Wrapped" };

  const title = `${stats.name ?? stats.login}'s GitHub Wrapped${year ? ` ${year}` : ""}`;
  const description = `${formatNumber(stats.totalContributions)} contributions, top languages and coder personality from ${periodLabel(year)}.`;
  const image = {
    url: cardPath(stats.login, { year }),
    ...CARD_SIZE,
    alt: `${title} summary card`,
  };
  return {
    title,
    description,
    openGraph: { title, description, images: [image] },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// Server Component: runs only on the server, so the GitHub token never
// reaches the browser. Only the computed stats are sent to <Story>.
export default async function WrappedPage({ params, searchParams }: Props) {
  const { username } = await params;
  const year = await readYear(searchParams);
  let stats: WrappedStats;
  try {
    stats = await getWrappedStats(username, year);
  } catch (error) {
    if (error instanceof UserNotFoundError) notFound();
    // Handled here, not in error.tsx, because in production Next.js hides
    // server error details from error.tsx, so it could not tell them apart.
    if (error instanceof RateLimitError) return <RateLimited />;
    throw error; // anything else: error.tsx
  }

  // A new key when the year changes restarts the story from the first slide.
  return <Story key={year ?? "last-12-months"} stats={stats} />;
}

function RateLimited() {
  return (
    <StatusScreen
      emoji="⏳"
      title="GitHub needs a short break"
      message="We have used up our GitHub requests for this hour. Please try again in a few minutes."
    >
      <Link href="/" className={secondaryButtonClass}>
        Home
      </Link>
    </StatusScreen>
  );
}
