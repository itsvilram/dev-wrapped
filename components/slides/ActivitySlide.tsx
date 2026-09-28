import { formatNumber, plural } from "@/lib/format";
import type { Activity } from "@/lib/types";
import { SlideLayout } from "./SlideLayout";

type Props = { activity: Activity; stars: number };

// What the contribution total is made of, plus stars on the user's repos.
export function ActivitySlide({ activity, stars }: Props) {
  const items = [
    { label: "commits", value: activity.commits },
    { label: "pull requests", value: activity.pullRequests },
    { label: "code reviews", value: activity.reviews },
    { label: "issues", value: activity.issues },
  ];

  return (
    <SlideLayout
      eyebrow="Beyond the total"
      footnote={
        <>
          ⭐ <strong>{formatNumber(stars)}</strong> {plural(stars, "star")} on
          your public repos, all time
        </>
      }
    >
      <dl className="grid w-full grid-cols-2 gap-4">
        {items.map((item) => (
          // flex-col-reverse shows the number first while keeping the
          // correct <dt> (label) then <dd> (value) order for screen readers.
          <div
            key={item.label}
            className="flex flex-col-reverse rounded-2xl bg-white/10 p-4"
          >
            <dt className="mt-1 text-white/80">{item.label}</dt>
            <dd className="text-4xl font-black tabular-nums">
              {formatNumber(item.value)}
            </dd>
          </div>
        ))}
      </dl>
    </SlideLayout>
  );
}
