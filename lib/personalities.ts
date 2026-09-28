import type { Personality } from "./types";

export const PERSONALITIES: Record<
  Personality,
  { emoji: string; description: string }
> = {
  "Night Owl": {
    emoji: "🦉",
    description: "Your code comes alive after 10 PM.",
  },
  "Early Bird": {
    emoji: "🐦",
    description: "You ship before most people finish breakfast.",
  },
  "Weekend Warrior": {
    emoji: "🏕️",
    description: "More than a third of your work happens on weekends.",
  },
  "Streak Machine": {
    emoji: "🔥",
    description: "30+ days in a row. Consistency is your superpower.",
  },
  Polyglot: {
    emoji: "🌍",
    description: "Five or more languages, each with a real share of your code.",
  },
  "Steady Builder": {
    emoji: "🧱",
    description: "Reliable progress, week after week.",
  },
};
