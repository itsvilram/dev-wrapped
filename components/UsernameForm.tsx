"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { isValidUsername } from "@/lib/username";

export function UsernameForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = value.trim().replace(/^@/, "");
    if (!isValidUsername(username)) {
      setError("That doesn't look like a GitHub username.");
      return;
    }
    setError(null);
    startTransition(() => router.push(`/${username}`));
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex w-full max-w-sm flex-col gap-2"
    >
      <label htmlFor="username" className="text-left text-sm font-medium">
        Enter a GitHub username
      </label>
      <div className="flex gap-2">
        <input
          id="username"
          name="username"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. torvalds"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby={error ? "username-error" : undefined}
          className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {isPending ? "Loading…" : "Go"}
        </button>
      </div>
      {error && (
        <p
          id="username-error"
          role="alert"
          className="text-left text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </form>
  );
}
