import { formatNumber } from "@/lib/format";
import { SlideLayout } from "./SlideLayout";

export function ContributionsSlide({ total }: { total: number }) {
  const perWeek = Math.round(total / 52);
  return (
    <SlideLayout
      eyebrow="In the last 12 months"
      footnote={`That's about ${formatNumber(perWeek)} a week.`}
    >
      <p className="text-7xl font-black tabular-nums sm:text-8xl">
        {formatNumber(total)}
      </p>
      <p className="text-2xl font-semibold">contributions</p>
    </SlideLayout>
  );
}
