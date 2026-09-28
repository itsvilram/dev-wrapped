import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CARD_SIZE } from "@/components/ShareCard";
import { Story } from "@/components/Story";
import { formatNumber } from "@/lib/format";
import { UserNotFoundError } from "@/lib/github";
import { getWrappedStats } from "@/lib/wrapped";

// Tags that make the link preview nicely on LinkedIn, WhatsApp, X, etc.
// getWrappedStats is wrapped in cache(), so this does not fetch twice.
export async function generateMetadata({
  params,
}: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const stats = await getWrappedStats(username).catch(() => null);
  if (!stats) return { title: "Dev Wrapped" };

  const title = `${stats.name ?? stats.login}'s GitHub Wrapped`;
  const description = `${formatNumber(stats.totalContributions)} contributions, top languages and coder personality from the last 12 months.`;
  const image = {
    url: `/api/card/${stats.login}`,
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
export default async function WrappedPage({
  params,
}: PageProps<"/[username]">) {
  const { username } = await params;
  const stats = await getWrappedStats(username).catch((error) => {
    if (error instanceof UserNotFoundError) notFound();
    throw error;
  });

  return <Story stats={stats} />;
}
