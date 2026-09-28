import Image from "next/image";
import type { WrappedStats } from "@/lib/types";
import { SlideLayout } from "./SlideLayout";

type Props = Pick<WrappedStats, "login" | "name" | "avatarUrl">;

export function IntroSlide({ login, name, avatarUrl }: Props) {
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
      <p className="text-2xl font-semibold">Here is your last 12 months.</p>
    </SlideLayout>
  );
}
