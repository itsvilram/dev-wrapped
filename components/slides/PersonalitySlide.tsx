import { PERSONALITIES } from "@/lib/personalities";
import type { Personality } from "@/lib/types";
import { SlideLayout } from "./SlideLayout";

// `personality` is null until we know the viewer's timezone.
export function PersonalitySlide({
  personality,
}: {
  personality: Personality | null;
}) {
  if (!personality) {
    return (
      <SlideLayout eyebrow="Your coder personality">
        <p className="text-2xl">…</p>
      </SlideLayout>
    );
  }

  const { emoji, description } = PERSONALITIES[personality];
  return (
    <SlideLayout eyebrow="Your coder personality">
      <p className="text-8xl" aria-hidden="true">
        {emoji}
      </p>
      <p className="text-5xl font-black">{personality}</p>
      <p className="text-xl">{description}</p>
    </SlideLayout>
  );
}
