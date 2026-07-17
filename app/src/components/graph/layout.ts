// dagre-driven layout + heat coloring helpers for the coverage map
import dagre from "@dagrejs/dagre";
import { nodeRisk } from "../../data/dataService";
import type { NavNode, NodeStats } from "../../types";

export const NODE_W = 200;
export const NODE_H = 96;

export type ViewMode = "coverage" | "risk";

export interface XY {
  x: number;
  y: number;
}

/** dagre top-bottom tree layout; returns top-left position per node id */
export function layoutNodes(navNodes: NavNode[]): Map<string, XY> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", ranksep: 70, nodesep: 30 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of navNodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const n of navNodes) {
    if (n.parent && navNodes.some((p) => p.id === n.parent)) g.setEdge(n.parent, n.id);
  }

  dagre.layout(g);

  const positions = new Map<string, XY>();
  for (const n of navNodes) {
    const p = g.node(n.id);
    positions.set(n.id, { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 });
  }
  return positions;
}

export interface Heat {
  /** solid color for the node's left border + minimap fill */
  color: string;
  /** soft glow color for box-shadow */
  glow: string;
  /** true when the node deserves a strong glow (high risk) */
  strong: boolean;
}

// literal hex values (not CSS vars) so the MiniMap SVG fill attribute works too
const COVERED = "#22c55e";
const PARTIAL = "#f59e0b";
const UNCOVERED = "#ef4444";
const NEUTRAL = "rgba(148, 163, 184, 0.32)";

export function heatFor(stats: NodeStats, mode: ViewMode): Heat {
  if (mode === "coverage") {
    switch (stats.coverage) {
      case "covered":
        return { color: COVERED, glow: "rgba(34, 197, 94, 0.16)", strong: false };
      case "partial":
        return { color: PARTIAL, glow: "rgba(245, 158, 11, 0.16)", strong: false };
      default:
        return { color: UNCOVERED, glow: "rgba(239, 68, 68, 0.18)", strong: false };
    }
  }
  const risk = nodeRisk(stats);
  if (risk === 0) return { color: NEUTRAL, glow: "transparent", strong: false };
  if (risk < 5) return { color: PARTIAL, glow: "rgba(245, 158, 11, 0.22)", strong: false };
  return { color: UNCOVERED, glow: "rgba(239, 68, 68, 0.38)", strong: true };
}
