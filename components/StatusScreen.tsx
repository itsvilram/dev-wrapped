import type { ReactNode } from "react";

type Props = {
  emoji: string;
  title: string;
  message: string;
  children?: ReactNode; // actions, e.g. a retry button or a form
};

// Full-page message used for "not found", "rate limited" and errors.
export function StatusScreen({ emoji, title, message, children }: Props) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-6xl" aria-hidden="true">
        {emoji}
      </p>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-300">{message}</p>
      </div>
      {children}
    </main>
  );
}

export const secondaryButtonClass =
  "rounded-xl border border-neutral-300 px-5 py-3 font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";
