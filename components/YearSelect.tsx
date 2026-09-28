"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { wrappedPath } from "@/lib/links";
import { availableYears } from "@/lib/period";

type Props = {
  login: string;
  year: number | null;
  joinedYear: number;
  currentYear: number; // from the server, so the options match on hydration
};

// Switches between "last 12 months" and any calendar year since the user
// joined GitHub. A real <select> is keyboard and screen-reader friendly.
export function YearSelect({ login, year, joinedYear, currentYear }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const years = availableYears(joinedYear, currentYear);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-white/80">Showing</span>
      <select
        value={year ?? ""}
        disabled={isPending}
        onChange={(event) => {
          const value = event.target.value;
          startTransition(() =>
            router.push(wrappedPath(login, value ? Number(value) : null)),
          );
        }}
        className="rounded-full bg-white/15 px-3 py-1.5 font-semibold text-white disabled:opacity-60 [&>option]:text-neutral-900"
      >
        <option value="">Last 12 months</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
