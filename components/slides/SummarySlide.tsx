import Image from "next/image";
import { formatNumber, plural } from "@/lib/format";
import { PERSONALITIES } from "@/lib/personalities";
import type { Personality, WrappedStats } from "@/lib/types";
import { SlideLayout } from "./SlideLayout";

type Props = { stats: WrappedStats; personality: Personality | null };

export function SummarySlide({ stats, personality }: Props) {
  const items = [
    { label: "Contributions", value: formatNumber(stats.totalContributions) },
    {
      label: "Longest streak",
      value: `${stats.longestStreak} ${plural(stats.longestStreak, "day")}`,
    },
    { label: "Top language", value: stats.languages[0]?.name ?? "None" },
    {
      label: "Personality",
      value: personality
        ? `${PERSONALITIES[personality].emoji} ${personality}`
        : "…",
    },
  ];

  return (
    <SlideLayout eyebrow="Your year in code">
      <div className="w-full rounded-3xl bg-white/10 p-6 shadow-2xl ring-1 ring-white/20 backdrop-blur">
        <div className="flex items-center gap-4">
          <Image
            src={stats.avatarUrl}
            alt=""
            width={64}
            height={64}
            className="rounded-full"
          />
          <div className="text-left">
            <p className="text-xl font-bold">{stats.name ?? stats.login}</p>
            <p className="text-white/80">@{stats.login}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-left">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="text-xs tracking-wider text-white/70 uppercase">
                {item.label}
              </dt>
              <dd className="text-lg font-bold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </SlideLayout>
  );
}
