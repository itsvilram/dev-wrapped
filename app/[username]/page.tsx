import { notFound } from "next/navigation";
import { Story } from "@/components/Story";
import { UserNotFoundError } from "@/lib/github";
import { getWrappedStats } from "@/lib/wrapped";

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
