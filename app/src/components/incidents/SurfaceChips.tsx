// Product filter chips — top-right of the Incidents page (user decision:
// products live on the main page, not the sidebar).
import { getSurfaces } from "../../data/dataService";
import type { SurfaceId } from "../../types";

const SURFACE_COLORS: Record<SurfaceId, string> = {
  enterprise: "#4a9ef5",
  retail: "#9b6dff",
  windsurf: "#2ecda7",
  "devin-cli": "#f5a623",
};

export function SurfaceChips({
  counts,
  active,
  onToggle,
}: {
  counts: Record<string, number>;
  active: Set<SurfaceId>;
  onToggle: (id: SurfaceId) => void;
}) {
  const surfaces = getSurfaces().filter((s) => (counts[s.id] ?? 0) > 0);
  return (
    <span className="surface-chips" aria-label="Filter by product">
      {surfaces.map((s) => (
        <button
          key={s.id}
          className={`surface-chip ${active.has(s.id) ? "on" : ""}`}
          onClick={() => onToggle(s.id)}
          aria-pressed={active.has(s.id)}
        >
          <span className="surface-dot" style={{ background: SURFACE_COLORS[s.id] }} />
          {s.label} <span className="num">{counts[s.id] ?? 0}</span>
        </button>
      ))}
    </span>
  );
}
