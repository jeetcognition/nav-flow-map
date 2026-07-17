// dagre-driven layout + heat coloring helpers for the coverage map
import { graphlib, layout } from "@dagrejs/dagre";
import type { NavNode } from "../../types";

export const NODE_W = 200;
export const NODE_H = 96;

export interface XY {
  x: number;
  y: number;
}

/** dagre top-bottom tree layout; returns top-left position per node id */
export function layoutNodes(navNodes: NavNode[]): Map<string, XY> {
  const g = new graphlib.Graph();
  g.setGraph({ rankdir: "TB", ranksep: 70, nodesep: 30 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of navNodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const n of navNodes) {
    if (n.parent && navNodes.some((p) => p.id === n.parent)) g.setEdge(n.parent, n.id);
  }

  layout(g);

  const positions = new Map<string, XY>();
  for (const n of navNodes) {
    const p = g.node(n.id);
    positions.set(n.id, { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 });
  }
  return positions;
}
