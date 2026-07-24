import type { CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { ProgressRing } from "../ui/ProgressRing";
import { pct } from "../../lib/format";
import type { NavNode, NodeStats } from "../../types";

export type FlowNodeData = {
  nav: NavNode;
  stats: NodeStats;
  mode: "coverage" | "risk";
  /** count of hidden descendants when this branch is collapsed */
  collapsedCount: number;
  /** node is on the selected node's parent chain */
  onPath: boolean;
  /** some node is selected and this one is neither selected nor on its path */
  dimmed: boolean;
  onToggleBranch: (id: string) => void;
};

export type FlowNodeType = Node<FlowNodeData, "flow">;

const GROUP_LABEL: Record<NavNode["group"], string> = {
  entry: "Entry",
  suborg: "Sub-org",
  personal: "Personal",
  enterprise: "Enterprise",
};

const NEUTRAL = "rgba(148, 163, 184, 0.32)";

/** Coverage mode: green/amber/red by automation coverage.
 *  Risk mode: red on nodes with open bugs (the "red thing"), neutral otherwise. */
function heat(stats: NodeStats, mode: "coverage" | "risk") {
  if (mode === "coverage") {
    if (stats.total === 0) return { color: NEUTRAL, glow: "transparent", hot: false };
    if (stats.coverage === "covered")
      return { color: "#22c55e", glow: "rgba(34,197,94,0.16)", hot: false };
    if (stats.coverage === "partial")
      return { color: "#f59e0b", glow: "rgba(245,158,11,0.16)", hot: false };
    return { color: "#ef4444", glow: "rgba(239,68,68,0.18)", hot: false };
  }
  if (stats.openBugs > 0) return { color: "#ef4444", glow: "rgba(239,68,68,0.4)", hot: true };
  return { color: NEUTRAL, glow: "transparent", hot: false };
}

export function FlowNode({ data, selected }: NodeProps<FlowNodeType>) {
  const { nav, stats, mode, collapsedCount, onPath, dimmed, onToggleBranch } = data;
  const h = heat(stats, mode);
  const hasCases = stats.total > 0;
  const autoPct = hasCases ? pct(stats.automated, stats.total) : 0;
  const collapsible = collapsedCount !== 0;

  const cls = [
    "flow-node",
    selected ? "is-selected" : "",
    onPath ? "is-onpath" : "",
    dimmed ? "is-dimmed" : "",
    h.hot ? "is-hot" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={{ "--fn-heat": h.color, "--fn-glow": h.glow } as CSSProperties}
      title={nav.desc || nav.label}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="fn-top">
        <div className="fn-text">
          <div className="fn-label">{nav.label}</div>
          <span className={`fn-group fn-group-${nav.group}`}>{GROUP_LABEL[nav.group]}</span>
        </div>
        <div className="fn-ring">
          <ProgressRing
            value={autoPct}
            size={32}
            stroke={3}
            color={hasCases ? "var(--accent)" : "var(--text-3)"}
            label={hasCases ? `${autoPct}% automated` : "No cases"}
          />
        </div>
      </div>
      <div className="fn-foot">
        <span className="fn-sub mono">{hasCases ? `${stats.total} cases` : "no cases"}</span>
        {collapsible && (
          <button
            className="fn-branch"
            title={collapsedCount > 0 ? `Expand ${collapsedCount} hidden pages` : "Collapse branch"}
            aria-label={
              collapsedCount > 0 ? `Expand ${collapsedCount} hidden pages` : "Collapse branch"
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleBranch(nav.id);
            }}
          >
            {collapsedCount > 0 ? (
              <>
                <CaretDown size={11} weight="bold" /> {collapsedCount}
              </>
            ) : (
              <CaretUp size={11} weight="bold" />
            )}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
