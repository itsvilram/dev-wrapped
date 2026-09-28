import { formatNumber, plural } from "@/lib/format";
import type { WrappedStats } from "@/lib/types";
import { SlideLayout } from "./SlideLayout";

export function TopRepoSlide({ repo }: { repo: WrappedStats["topRepo"] }) {
  if (!repo) {
    return (
      <SlideLayout eyebrow="Most commits went to">
        <p className="text-2xl font-semibold">
          No commits to public repos this year.
        </p>
      </SlideLayout>
    );
  }

  return (
    <SlideLayout eyebrow="Most commits went to">
      <a
        href={`https://github.com/${repo.name}`}
        target="_blank"
        rel="noreferrer"
        className="text-3xl font-bold break-all underline decoration-white/40 underline-offset-8 hover:decoration-white sm:text-4xl"
      >
        {repo.name}
      </a>
      <p className="text-xl">
        <strong className="font-bold">{formatNumber(repo.commits)}</strong>{" "}
        {plural(repo.commits, "commit")}
      </p>
    </SlideLayout>
  );
}
