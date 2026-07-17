import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface StripStat {
  label: string;
  value: ReactNode;
  tone?: "default" | "green" | "red" | "amber" | "purple";
  to?: string;
}

const TONE: Record<NonNullable<StripStat["tone"]>, string> = {
  default: "var(--text)",
  green: "var(--accent-strong)",
  red: "var(--red-soft)",
  amber: "var(--amber-soft)",
  purple: "var(--purple-soft)",
};

/** Compact one-line stat summary — replaces rows of large stat cards. */
export function StatStrip({ stats }: { stats: StripStat[] }) {
  return (
    <div className="stat-strip card">
      {stats.map((s) => {
        const body = (
          <>
            <span className="stat-strip-value num" style={{ color: TONE[s.tone ?? "default"] }}>
              {s.value}
            </span>
            <span className="stat-strip-label">{s.label}</span>
          </>
        );
        return s.to ? (
          <Link key={s.label} to={s.to} className="stat-strip-item linked">
            {body}
          </Link>
        ) : (
          <div key={s.label} className="stat-strip-item">
            {body}
          </div>
        );
      })}
    </div>
  );
}
