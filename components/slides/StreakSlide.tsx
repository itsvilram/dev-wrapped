import { plural } from "@/lib/format";
import { SlideLayout } from "./SlideLayout";

// showCurrent is false for a finished year: "current" only means
// something for a period that ends today.
type Props = { longest: number; current: number; showCurrent: boolean };

export function StreakSlide({ longest, current, showCurrent }: Props) {
  const onBestStreak = showCurrent && current > 0 && current === longest;
  return (
    <SlideLayout
      eyebrow="Streaks"
      footnote={
        onBestStreak
          ? "You're on your best streak right now. Keep going!"
          : "A streak is days in a row with at least one contribution."
      }
    >
      <div
        className={`grid w-full gap-6 ${showCurrent ? "grid-cols-2" : "grid-cols-1"}`}
      >
        <Stat value={longest} label="Longest streak" />
        {showCurrent && <Stat value={current} label="Current streak" />}
      </div>
    </SlideLayout>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-6xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-white/80">{plural(value, "day")}</p>
      <p className="mt-2 text-lg font-semibold">{label}</p>
    </div>
  );
}
