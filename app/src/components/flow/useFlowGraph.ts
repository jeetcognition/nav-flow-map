// Builds the React Flow node/edge model for NavFlow from the nav tree, and
// refits the view whenever the visible tree shape changes.
import { useEffect, useMemo, useRef } from "react";
import { useReactFlow, type Edge } from "@xyflow/react";
import { nodeStats } from "../../data/dataService";
import { extraLinks } from "../../data/editsService";
import { layoutNodes } from "../graph/layout";
import { type FlowNodeType } from "./FlowNode";
import { buildFlowEdges, buildFlowNodes } from "./graphModel";
import type { useNavTree } from "./useNavTree";
import type { HeatMode } from "./FlowToolbar";
import type { NodeStats } from "../../types";

export function useFlowGraph(
  tree: ReturnType<typeof useNavTree>,
  selectedId: string | null,
  mode: HeatMode,
) {
  const { fitView } = useReactFlow();
  const { visiblePages, pathIds } = tree;

  const statsById = useMemo(() => {
    const m = new Map<string, NodeStats>();
    for (const p of visiblePages) m.set(p.id, nodeStats(p.id));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePages, tree.dataVersion]);

  const positions = useMemo(() => layoutNodes(visiblePages), [visiblePages]);

  const rfNodes = useMemo<FlowNodeType[]>(
    () =>
      buildFlowNodes({
        visiblePages,
        positions,
        statsById,
        fallbackStats: nodeStats,
        childrenOf: tree.childrenOf,
        expanded: tree.expanded,
        descendantCount: tree.descendantCount,
        pathIds,
        selectedId,
        mode,
        onToggleBranch: tree.toggleBranch,
      }),
    [
      visiblePages,
      positions,
      statsById,
      tree.childrenOf,
      tree.expanded,
      tree.descendantCount,
      pathIds,
      selectedId,
      mode,
      tree.toggleBranch,
    ],
  );

  const rfEdges = useMemo<Edge[]>(
    () => buildFlowEdges(visiblePages, extraLinks(), pathIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visiblePages, pathIds, tree.editsVersion],
  );

  // refit when the visible tree shape changes (old relayoutAndFitGraph behavior)
  const visibleSignature = useMemo(
    () =>
      visiblePages
        .map((p) => p.id)
        .sort()
        .join(","),
    [visiblePages],
  );
  const lastSignature = useRef(visibleSignature);
  useEffect(() => {
    if (lastSignature.current === visibleSignature) return;
    lastSignature.current = visibleSignature;
    const t = setTimeout(() => fitView({ padding: 0.14, duration: 300 }), 60);
    return () => clearTimeout(t);
  }, [visibleSignature, fitView]);

  return { rfNodes, rfEdges };
}
