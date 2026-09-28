import { formatNumber } from "@/lib/format";
import { periodLabel } from "@/lib/period";
import { SlideLayout } from "./SlideLayout";

type Props = { total: number; year: number | null };

export function ContributionsSlide({ total, year }: Props) {
  const perWeek = Math.round(total / 52);
  return (
    <SlideLayout
      eyebrow={`In ${periodLabel(year)}`}
      footnote={`That's about ${formatNumber(perWeek)} a week.`}
    >
      <p className="text-7xl font-black tabular-nums sm:text-8xl">
        {formatNumber(total)}
      </p>
      <p className="text-2xl font-semibold">contributions</p>
    </SlideLayout>
  );
}
