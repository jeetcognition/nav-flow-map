// Pure builders that turn the visible nav tree into React Flow nodes/edges.
// Kept free of hooks so the mapping stays independently readable.
import type { Edge } from "@xyflow/react";
import type { NavNode, NodeStats } from "../../types";
import type { FlowNodeType } from "./FlowNode";
import type { ExtraLink } from "../../data/editsService";
import type { XY } from "../graph/layout";

export interface FlowGraphArgs {
  visiblePages: NavNode[];
  positions: Map<string, XY>;
  statsById: Map<string, NodeStats>;
  fallbackStats: (id: string) => NodeStats;
  childrenOf: Map<string, NavNode[]>;
  expanded: Set<string>;
  descendantCount: (id: string) => number;
  pathIds: Set<string>;
  selectedId: string | null;
  mode: "coverage" | "risk";
  onToggleBranch: (id: string) => void;
}

export function buildFlowNodes(args: FlowGraphArgs): FlowNodeType[] {
  const {
    visiblePages,
    positions,
    statsById,
    fallbackStats,
    childrenOf,
    expanded,
    descendantCount,
    pathIds,
    selectedId,
    mode,
    onToggleBranch,
  } = args;
  return visiblePages.map((p) => {
    const hasKids = childrenOf.has(p.id);
    const collapsedCount = hasKids ? (expanded.has(p.id) ? -1 : descendantCount(p.id)) : 0;
    return {
      id: p.id,
      type: "flow" as const,
      position: positions.get(p.id) ?? { x: 0, y: 0 },
      data: {
        nav: p,
        stats: statsById.get(p.id) ?? fallbackStats(p.id),
        mode,
        collapsedCount,
        onPath: pathIds.has(p.id) && p.id !== selectedId,
        dimmed: pathIds.size > 0 && !pathIds.has(p.id),
        onToggleBranch,
      },
      selected: p.id === selectedId,
      draggable: false,
      connectable: false,
    };
  });
}

export function buildFlowEdges(
  visiblePages: NavNode[],
  extras: ExtraLink[],
  pathIds: Set<string>,
): Edge[] {
  const visible = new Set(visiblePages.map((p) => p.id));
  const treeEdges: Edge[] = visiblePages
    .filter((p) => p.parent && visible.has(p.parent))
    .map((p) => {
      const onPath = pathIds.has(p.id) && pathIds.has(p.parent!);
      return {
        id: `e-${p.parent}-${p.id}`,
        source: p.parent!,
        target: p.id,
        type: "smoothstep",
        style: onPath
          ? { stroke: "var(--accent)", strokeWidth: 2.2 }
          : {
              stroke: "var(--edge)",
              strokeWidth: 1.5,
              opacity: pathIds.size > 0 ? 0.35 : 1,
            },
      };
    });
  const extraEdges: Edge[] = extras
    .filter((l) => visible.has(l.source) && visible.has(l.target))
    .map((l) => ({
      id: `x-${l.source}-${l.target}`,
      source: l.source,
      target: l.target,
      type: "smoothstep",
      style: {
        stroke: "var(--ai)",
        strokeWidth: 1.6,
        strokeDasharray: "7 5",
        opacity: pathIds.size > 0 ? 0.45 : 0.9,
      },
    }));
  return [...treeEdges, ...extraEdges];
}
