// Shown instantly while the server fetches from GitHub. It has the same
// shape as the story, so the page does not jump when the data arrives.
export default function Loading() {
  return (
    <div
      role="status"
      className="relative flex h-dvh w-full flex-col items-center justify-center gap-6 bg-linear-to-br from-violet-600 to-indigo-950 p-6 text-white"
    >
      <div
        className="absolute inset-x-0 top-0 flex gap-1.5 p-4"
        aria-hidden="true"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-white/30" />
        ))}
      </div>
      <div
        className="flex flex-col items-center gap-6 motion-safe:animate-pulse"
        aria-hidden="true"
      >
        <div className="size-36 rounded-full bg-white/20" />
        <div className="h-9 w-56 rounded-lg bg-white/20" />
        <div className="h-5 w-32 rounded-lg bg-white/20" />
      </div>
      <p className="text-lg font-semibold">Unwrapping your year on GitHub…</p>
    </div>
  );
}
