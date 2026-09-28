import Image from "next/image";
import type { WrappedStats } from "@/lib/types";
import { YearSelect } from "../YearSelect";
import { SlideLayout } from "./SlideLayout";

type Props = Pick<
  WrappedStats,
  "login" | "name" | "avatarUrl" | "year" | "joinedYear" | "currentYear"
>;

export function IntroSlide({
  login,
  name,
  avatarUrl,
  year,
  joinedYear,
  currentYear,
}: Props) {
  return (
    <SlideLayout
      eyebrow="Your GitHub Wrapped"
      footnote="Tap the right side, or press →, to start"
    >
      <Image
        src={avatarUrl}
        alt=""
        width={144}
        height={144}
        priority
        className="rounded-full border-4 border-white/80 shadow-xl"
      />
      <div>
        <h1 className="text-4xl font-bold">{name ?? login}</h1>
        <p className="mt-1 text-lg text-white/80">@{login}</p>
      </div>
      <p className="text-2xl font-semibold">
        {year === null
          ? "Here are your last 12 months."
          : `Here is your ${year}.`}
      </p>
      <YearSelect
        login={login}
        year={year}
        joinedYear={joinedYear}
        currentYear={currentYear}
      />
    </SlideLayout>
  );
}
