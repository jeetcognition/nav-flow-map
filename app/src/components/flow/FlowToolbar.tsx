// NavFlow toolbar: fit view, layout + heat-mode toggles, legend, and the
// authoring/persistence actions (add page/link, save to repo, reset).
import {
  ArrowsInSimple,
  CornersOut,
  FloppyDisk,
  LinkSimple,
  Plus,
  SquareHalf,
  SquaresFour,
  Trash,
} from "@phosphor-icons/react";

export type LayoutMode = "split" | "graph" | "panel";
export type HeatMode = "coverage" | "risk";

const LEGEND: { color: string; label: string }[] = [
  { color: "var(--heat-covered)", label: "Covered" },
  { color: "var(--heat-partial)", label: "Partial" },
  { color: "var(--heat-uncovered)", label: "Uncovered" },
];

interface Props {
  layout: LayoutMode;
  mode: HeatMode;
  dirty: boolean;
  saving: boolean;
  confirmReset: boolean;
  onFit: () => void;
  onLayout: (l: LayoutMode) => void;
  onMode: (m: HeatMode) => void;
  onAddPage: () => void;
  onAddLink: () => void;
  onSave: () => void;
  onReset: () => void;
}

export function FlowToolbar({
  layout,
  mode,
  dirty,
  saving,
  confirmReset,
  onFit,
  onLayout,
  onMode,
  onAddPage,
  onAddLink,
  onSave,
  onReset,
}: Props) {
  return (
    <div className="fm-toolbar">
      <div className="fm-tools">
        <button className="btn fm-btn" onClick={onFit} title="Fit view">
          <ArrowsInSimple size={14} weight="bold" /> Fit
        </button>
        <div className="fm-seg" role="tablist" aria-label="Layout">
          {(
            [
              ["graph", "Graph", CornersOut],
              ["split", "Split", SquareHalf],
              ["panel", "Panel", SquaresFour],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              role="tab"
              aria-selected={layout === key}
              className={`fm-seg-btn ${layout === key ? "is-active" : ""}`}
              onClick={() => onLayout(key)}
            >
              <Icon size={13} weight="bold" /> {label}
            </button>
          ))}
        </div>
        <div className="fm-seg" role="tablist" aria-label="Heat mode">
          {(["coverage", "risk"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={`fm-seg-btn ${mode === m ? "is-active" : ""}`}
              onClick={() => onMode(m)}
            >
              {m === "coverage" ? "Coverage" : "Risk"}
            </button>
          ))}
        </div>
        {mode === "coverage" && (
          <div className="fm-legend">
            {LEGEND.map((l) => (
              <span key={l.label} className="fm-legend-item">
                <span className="fm-legend-dot" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="fm-tools">
        <button className="btn fm-btn" onClick={onAddPage}>
          <Plus size={13} weight="bold" /> Add page
        </button>
        <button className="btn fm-btn" onClick={onAddLink}>
          <LinkSimple size={13} weight="bold" /> Add link
        </button>
        <button
          className="btn btn-primary fm-btn"
          disabled={!dirty || saving}
          title={dirty ? "Commit edits to the repo" : "No unsaved edits"}
          onClick={onSave}
        >
          <FloppyDisk size={13} weight="bold" /> {saving ? "Saving…" : "Save to repo"}
        </button>
        <button
          className={`btn fm-btn ${confirmReset ? "fm-btn-danger" : ""}`}
          disabled={!dirty}
          title="Discard local (unsaved) edits"
          onClick={onReset}
        >
          <Trash size={13} weight="bold" /> {confirmReset ? "Confirm reset?" : "Reset"}
        </button>
      </div>
    </div>
  );
}
