import { formatPercent } from "@/lib/format";
import type { LanguageShare } from "@/lib/types";
import { SlideLayout } from "./SlideLayout";

const FALLBACK_COLOR = "#ffffff";

export function LanguagesSlide({ languages }: { languages: LanguageShare[] }) {
  const top = languages.slice(0, 3);
  if (top.length === 0) {
    return (
      <SlideLayout eyebrow="Top languages">
        <p className="text-2xl font-semibold">No public code to measure yet.</p>
      </SlideLayout>
    );
  }

  return (
    <SlideLayout
      eyebrow="Top languages"
      footnote="By bytes of code in your public, non-fork repos."
    >
      <ol className="flex w-full flex-col gap-5">
        {top.map((language, i) => (
          <li key={language.name} className="text-left">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-3 text-2xl font-bold">
                {/* GitHub's own colour for the language, e.g. yellow for JavaScript */}
                <span
                  className="size-4 shrink-0 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: language.color ?? FALLBACK_COLOR }}
                />
                {i + 1}. {language.name}
              </span>
              <span className="text-xl tabular-nums">
                {formatPercent(language.percent)}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${language.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </SlideLayout>
  );
}
