import type { CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Bug, Fire } from "@phosphor-icons/react";
import { ProgressRing } from "../ui/ProgressRing";
import { pct } from "../../lib/format";
import type { NavNode, NodeStats } from "../../types";
import { heatFor, type ViewMode } from "./layout";

export type PageNodeData = {
  nav: NavNode;
  stats: NodeStats;
  mode: ViewMode;
};

export type PageNodeType = Node<PageNodeData, "page">;

const GROUP_LABEL: Record<NavNode["group"], string> = {
  entry: "Entry",
  suborg: "Sub-org",
  personal: "Personal",
  enterprise: "Enterprise",
};

export function PageNode({ data, selected }: NodeProps<PageNodeType>) {
  const { nav, stats, mode } = data;
  const heat = heatFor(stats, mode);
  const hasCases = stats.total > 0;
  const autoPct = hasCases ? pct(stats.automated, stats.total) : 0;

  const cls = ["page-node", selected ? "is-selected" : "", heat.strong ? "is-hot" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      style={{ "--pn-heat": heat.color, "--pn-glow": heat.glow } as CSSProperties}
      title={nav.desc}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="pn-top">
        <div className="pn-text">
          <div className="pn-label">{nav.label}</div>
          <span className={`pn-group pn-group-${nav.group}`}>{GROUP_LABEL[nav.group]}</span>
        </div>
        <div className="pn-ring">
          <ProgressRing
            value={autoPct}
            size={34}
            stroke={3}
            color={hasCases ? "var(--accent)" : "var(--text-3)"}
            label={hasCases ? `${autoPct}% automated` : "No cases"}
          />
        </div>
      </div>
      <div className="pn-foot">
        <span className="pn-sub mono">
          {stats.passing}/{stats.total} cases · {stats.automated} automated
        </span>
        <span className="pn-badges">
          {stats.openBugs > 0 && (
            <span
              className="pn-chip pn-chip-bug"
              title={`${stats.openBugs} open bug${stats.openBugs > 1 ? "s" : ""}`}
            >
              <Bug size={12} weight="duotone" />
              {stats.openBugs}
            </span>
          )}
          {stats.incidents > 0 && (
            <span
              className="pn-chip pn-chip-incident"
              title={`${stats.incidents} open incident${stats.incidents > 1 ? "s" : ""}`}
            >
              <Fire size={12} weight="duotone" />
              {stats.incidents}
            </span>
          )}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
