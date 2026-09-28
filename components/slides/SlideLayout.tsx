import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  children: ReactNode;
  footnote?: ReactNode;
};

// Shared layout for every slide: small heading, main content, optional note.
export function SlideLayout({ eyebrow, children, footnote }: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <p className="text-sm font-semibold tracking-widest text-white/80 uppercase">
        {eyebrow}
      </p>
      {children}
      {footnote && <p className="text-sm text-white/80">{footnote}</p>}
    </div>
  );
}
