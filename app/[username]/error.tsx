"use client"; // error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import { StatusScreen, secondaryButtonClass } from "@/components/StatusScreen";

// Catches anything the page throws that it did not handle itself, for
// example GitHub being down or a network failure. In production Next.js
// hides the real error message from the browser, so we show a general one.
export default function WrappedError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      emoji="📡"
      title="We couldn't reach GitHub"
      message="This is usually a short network or GitHub problem. Please try again."
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={retry}
          className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
        >
          Try again
        </button>
        <Link href="/" className={secondaryButtonClass}>
          Home
        </Link>
      </div>
    </StatusScreen>
  );
}
