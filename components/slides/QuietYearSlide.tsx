import Link from "next/link";
import { periodLabel } from "@/lib/period";
import { SlideLayout } from "./SlideLayout";

// Replaces the stat slides for users with no public contributions.
export function QuietYearSlide({ year }: { year: number | null }) {
  return (
    <SlideLayout
      eyebrow={`In ${periodLabel(year)}`}
      footnote="Private contributions only count if the user shows them on their GitHub profile."
    >
      <p className="text-7xl" aria-hidden="true">
        🌱
      </p>
      <p className="text-3xl font-bold">A quiet year on GitHub</p>
      <p className="text-lg">
        There is no public activity to wrap up yet. Push some code and come back
        later!
      </p>
      <Link
        href="/"
        className="rounded-full bg-white px-6 py-3 font-semibold text-neutral-900 hover:bg-white/85"
      >
        Try another username
      </Link>
    </SlideLayout>
  );
}
