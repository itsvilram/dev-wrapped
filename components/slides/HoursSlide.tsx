import { WEEKDAYS, formatHour } from "@/lib/format";
import { busiestHour, hourHistogram } from "@/lib/stats";
import { SlideLayout } from "./SlideLayout";

type Props = {
  pushTimes: string[] | null; // null: no hour data for this period
  year: number | null;
  busiestWeekday: number | null;
  timeZone: string | null; // null until the browser has told us
};

export function HoursSlide({
  pushTimes,
  year,
  busiestWeekday,
  timeZone,
}: Props) {
  const histogram =
    timeZone && pushTimes ? hourHistogram(pushTimes, timeZone) : null;
  const hour = histogram ? busiestHour(histogram) : null;
  const weekday = busiestWeekday === null ? null : WEEKDAYS[busiestWeekday];

  return (
    <SlideLayout
      eyebrow="When you code"
      footnote={
        pushTimes === null
          ? `GitHub only keeps about 30 days of activity times, so there is no hour data for ${year}.`
          : timeZone &&
            `Hours from your last ${pushTimes.length} public pushes (about 30 days), in your timezone (${timeZone}).`
      }
    >
      {histogram === null || hour === null ? (
        <p className="text-2xl font-semibold">
          {pushTimes === null
            ? "Busiest hour not available"
            : timeZone
              ? "No public pushes in the last 30 days."
              : "…"}
        </p>
      ) : (
        <>
          <p className="text-7xl font-black tabular-nums">{formatHour(hour)}</p>
          <p className="text-xl font-semibold">was your busiest hour</p>
          <HourChart histogram={histogram} highlight={hour} />
        </>
      )}
      {weekday && (
        <p className="text-xl">
          Busiest day: <strong className="font-bold">{weekday}</strong>
        </p>
      )}
    </SlideLayout>
  );
}

// 24 small bars, one per hour, the busiest one highlighted.
function HourChart({
  histogram,
  highlight,
}: {
  histogram: number[];
  highlight: number;
}) {
  const max = Math.max(...histogram);
  return (
    <div className="w-full" aria-hidden="true">
      <div className="flex h-20 items-end gap-0.5">
        {histogram.map((count, hour) => (
          <div
            key={hour}
            className={`flex-1 rounded-t ${hour === highlight ? "bg-white" : "bg-white/35"}`}
            style={{ height: `${Math.max((count / max) * 100, 4)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-white/70">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </div>
  );
}
