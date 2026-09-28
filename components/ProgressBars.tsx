type Props = { count: number; current: number };

// Instagram-style bars: slides already seen (and the current one) are filled.
export function ProgressBars({ count, current }: Props) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
        >
          <div
            className={`h-full bg-white motion-safe:transition-[width] motion-safe:duration-300 ${
              i <= current ? "w-full" : "w-0"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
