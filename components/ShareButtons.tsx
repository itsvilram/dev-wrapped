"use client";

import { useState } from "react";
import { cardPath } from "@/lib/links";

type Props = { login: string; year: number | null; timeZone: string | null };

export function ShareButtons({ login, year, timeZone }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const cardUrl = cardPath(login, { year, timeZone });

  // Uses the phone's share sheet when there is one, otherwise copies the link.
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${login}'s GitHub Wrapped`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setStatus("Link copied!");
      }
    } catch (error) {
      // The user closing the share sheet is not an error.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("Could not share. Copy the address bar link instead.");
      }
    }
  }

  const buttonClass =
    "flex-1 rounded-full px-5 py-3 text-center font-semibold transition-colors";

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full gap-3">
        {/* Same-origin link, so the `download` attribute saves the PNG. */}
        <a
          href={cardUrl}
          download={`${login}-dev-wrapped${year ? `-${year}` : ""}.png`}
          className={`${buttonClass} bg-white text-neutral-900 hover:bg-white/85`}
        >
          Download
        </a>
        <button
          type="button"
          onClick={share}
          className={`${buttonClass} bg-white/15 hover:bg-white/25`}
        >
          Share
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-white/80">
        {status}
      </p>
    </div>
  );
}
