import Link from "next/link";
import { UsernameForm } from "@/components/UsernameForm";

const EXAMPLES = ["torvalds", "gaearon", "sindresorhus"];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-black tracking-tight">Dev Wrapped</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300">
          Your last 12 months on GitHub, as a story.
        </p>
      </div>
      <UsernameForm />
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Try{" "}
        {EXAMPLES.map((name, i) => (
          <span key={name}>
            {i > 0 && ", "}
            <Link
              href={`/${name}`}
              className="font-medium underline underline-offset-4"
            >
              {name}
            </Link>
          </span>
        ))}
      </p>
    </main>
  );
}
