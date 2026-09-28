import { formatNumber, plural } from "@/lib/format";
import { PERSONALITIES } from "@/lib/personalities";
import type { Personality, WrappedStats } from "@/lib/types";

export const CARD_SIZE = { width: 1200, height: 630 };

type Props = { stats: WrappedStats; personality: Personality };

// Rendered to a PNG by next/og (Satori). Satori supports only a subset of
// CSS: flexbox, inline styles, and every <div> with children needs
// display: flex. No Tailwind classes here.
export function ShareCard({ stats, personality }: Props) {
  const topLanguages =
    stats.languages
      .slice(0, 3)
      .map((l) => l.name)
      .join(" · ") || "None yet";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        color: "white",
        backgroundImage: "linear-gradient(135deg, #7c3aed 0%, #1e1b4b 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {/* Satori needs a plain <img>, next/image does not work here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl(stats.avatarUrl)}
          alt=""
          width={140}
          height={140}
          style={{
            borderRadius: 70,
            border: "6px solid rgba(255,255,255,0.8)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 700 }}>
            {stats.name ?? stats.login}
          </div>
          <div style={{ fontSize: 32, opacity: 0.8 }}>
            {`@${stats.login} · GitHub Wrapped, last 12 months`}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <Stat
          label="Contributions"
          value={formatNumber(stats.totalContributions)}
        />
        <Stat
          label="Longest streak"
          value={`${stats.longestStreak} ${plural(stats.longestStreak, "day")}`}
        />
        <Stat
          label="Personality"
          value={`${PERSONALITIES[personality].emoji} ${personality}`}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 30,
        }}
      >
        <div
          style={{ display: "flex" }}
        >{`Top languages: ${topLanguages}`}</div>
        <div style={{ display: "flex", opacity: 0.7 }}>Dev Wrapped</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: 28,
        borderRadius: 24,
        backgroundColor: "rgba(255,255,255,0.12)",
      }}
    >
      <div style={{ fontSize: 24, opacity: 0.75, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 48, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// Ask GitHub for a small avatar (the `s` parameter) instead of the full size.
function avatarUrl(url: string): string {
  const small = new URL(url);
  small.searchParams.set("s", "280");
  return small.toString();
}
