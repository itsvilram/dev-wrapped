"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useTimeZone } from "@/hooks/useTimeZone";
import { personalityFor } from "@/lib/stats";
import type { WrappedStats } from "@/lib/types";
import { ProgressBars } from "./ProgressBars";
import { ContributionsSlide } from "./slides/ContributionsSlide";
import { HoursSlide } from "./slides/HoursSlide";
import { IntroSlide } from "./slides/IntroSlide";
import { LanguagesSlide } from "./slides/LanguagesSlide";
import { PersonalitySlide } from "./slides/PersonalitySlide";
import { StreakSlide } from "./slides/StreakSlide";
import { SummarySlide } from "./slides/SummarySlide";
import { TopRepoSlide } from "./slides/TopRepoSlide";

type Slide = { label: string; background: string; content: ReactNode };

// Slides enter from the side we are moving towards and leave the other way.
const variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -60 }),
};

export function Story({ stats }: { stats: WrappedStats }) {
  const timeZone = useTimeZone();
  const slides = buildSlides(stats, timeZone);
  const last = slides.length - 1;

  // Index of the current slide, and +1/-1 for the direction we last moved.
  const [[index, direction], setPosition] = useState([0, 1]);
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (step: 1 | -1) =>
      setPosition(([current]) => [
        Math.min(Math.max(current + step, 0), last),
        step,
      ]),
    [last],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === " " && !isInteractive(event.target)) {
        event.preventDefault(); // stop the page from scrolling
        go(1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  // Tap the left third to go back, anywhere else to go forward.
  // Taps on links and buttons do their own thing instead.
  function onTap(event: MouseEvent<HTMLElement>) {
    if (isInteractive(event.target)) return;
    const { left, width } = event.currentTarget.getBoundingClientRect();
    go(event.clientX - left < width / 3 ? -1 : 1);
  }

  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`GitHub Wrapped for ${stats.login}`}
      onClick={onTap}
      className="relative h-dvh w-full cursor-pointer overflow-hidden bg-neutral-950 text-white select-none"
    >
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}: ${slide.label}`}
          className={`absolute inset-0 flex items-center justify-center bg-linear-to-br px-6 pt-20 pb-24 ${slide.background}`}
        >
          {slide.content}
        </motion.div>
      </AnimatePresence>

      <header className="absolute inset-x-0 top-0 flex flex-col gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <ProgressBars count={slides.length} current={index} />
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Dev Wrapped</span>
          <Link
            href="/"
            aria-label="Close and go back home"
            className="rounded-full px-2 text-2xl leading-none"
          >
            ×
          </Link>
        </div>
      </header>

      <nav
        aria-label="Slides"
        className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <NavButton
          label="Previous slide"
          disabled={index === 0}
          onClick={() => go(-1)}
        >
          ‹
        </NavButton>
        <span className="text-sm text-white/80 tabular-nums" aria-hidden="true">
          {index + 1} / {slides.length}
        </span>
        <NavButton
          label="Next slide"
          disabled={index === last}
          onClick={() => go(1)}
        >
          ›
        </NavButton>
      </nav>

      {/* Tells screen reader users which slide they are on. */}
      <p aria-live="polite" className="sr-only">
        Slide {index + 1} of {slides.length}: {slide.label}
      </p>
    </section>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-12 place-items-center rounded-full bg-white/15 text-3xl leading-none hover:bg-white/25 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function buildSlides(stats: WrappedStats, timeZone: string | null): Slide[] {
  const personality = timeZone ? personalityFor(stats, timeZone) : null;
  return [
    {
      label: "Intro",
      background: "from-violet-600 to-indigo-950",
      content: <IntroSlide {...stats} />,
    },
    {
      label: "Total contributions",
      background: "from-emerald-600 to-teal-950",
      content: <ContributionsSlide total={stats.totalContributions} />,
    },
    {
      label: "Top languages",
      background: "from-sky-600 to-blue-950",
      content: <LanguagesSlide languages={stats.languages} />,
    },
    {
      label: "Busiest hour and day",
      background: "from-fuchsia-600 to-purple-950",
      content: (
        <HoursSlide
          pushTimes={stats.pushTimes}
          busiestWeekday={stats.busiestWeekday}
          timeZone={timeZone}
        />
      ),
    },
    {
      label: "Streaks",
      background: "from-orange-600 to-red-950",
      content: (
        <StreakSlide
          longest={stats.longestStreak}
          current={stats.currentStreak}
        />
      ),
    },
    {
      label: "Most-contributed repo",
      background: "from-cyan-600 to-slate-950",
      content: <TopRepoSlide repo={stats.topRepo} />,
    },
    {
      label: "Coder personality",
      background: "from-pink-600 to-rose-950",
      content: <PersonalitySlide personality={personality} />,
    },
    {
      label: "Summary",
      background: "from-indigo-600 to-neutral-950",
      content: <SummarySlide stats={stats} personality={personality} />,
    },
  ];
}

function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest("a, button, input, select, textarea") !== null
  );
}
