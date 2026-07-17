import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { getNode, getNodes, nodeStats, surfaceStats } from "../data/dataService";
import { EASE } from "../lib/motion";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useDataVersion } from "../hooks/useData";
import { NodePanel } from "../components/graph/NodePanel";
import { PageNode, type PageNodeData, type PageNodeType } from "../components/graph/PageNode";
import { heatFor, layoutNodes, NODE_H, NODE_W, type ViewMode } from "../components/graph/layout";
import type { NodeStats } from "../types";
import "@xyflow/react/dist/style.css";
import "../styles/graph.css";

const nodeTypes: NodeTypes = { page: PageNode };

const EDGE_STYLE = { stroke: "var(--edge)", strokeWidth: 1.5 };

// map is read-only: positions come from dagre, selection lives in the URL
const noop = () => {};

const LEGEND: { color: string; label: string }[] = [
  { color: "var(--heat-covered)", label: "Covered" },
  { color: "var(--heat-partial)", label: "Partial" },
  { color: "var(--heat-uncovered)", label: "Uncovered" },
  { color: "var(--heat-bug)", label: "Has bug" },
  { color: "var(--heat-incident)", label: "Has incident" },
];

export default function GraphMap() {
  return (
    <div className="graph-page">
      <ReactFlowProvider>
        <GraphInner />
      </ReactFlowProvider>
    </div>
  );
}

function GraphInner() {
  const version = useDataVersion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setCenter } = useReactFlow();

  const mode: ViewMode = searchParams.get("view") === "risk" ? "risk" : "coverage";
  const selectedParam = searchParams.get("node");
  const selectedNode = selectedParam ? getNode(selectedParam) : undefined;
  const selectedId = selectedNode?.id ?? null;

  const navNodes = getNodes();

  // static tree → layout once
  const positions = useMemo(() => layoutNodes(navNodes), [navNodes]);

  const statsById = useMemo(() => {
    const map = new Map<string, NodeStats>();
    for (const n of navNodes) map.set(n.id, nodeStats(n.id));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navNodes, version]);

  const rfNodes = useMemo<PageNodeType[]>(
    () =>
      navNodes.map((n) => ({
        id: n.id,
        type: "page" as const,
        position: positions.get(n.id) ?? { x: 0, y: 0 },
        data: { nav: n, stats: statsById.get(n.id) ?? nodeStats(n.id), mode },
        selected: n.id === selectedId,
        draggable: false,
        connectable: false,
      })),
    [navNodes, positions, statsById, mode, selectedId],
  );

  const rfEdges = useMemo<Edge[]>(
    () =>
      navNodes
        .filter((n) => n.parent && positions.has(n.parent))
        .map((n) => ({
          id: `e-${n.parent}-${n.id}`,
          source: n.parent!,
          target: n.id,
          type: "smoothstep",
          animated: false,
          style: EDGE_STYLE,
        })),
    [navNodes, positions],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === null) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const selectNode = useCallback((id: string | null) => setParam("node", id), [setParam]);
  const setMode = useCallback(
    (m: ViewMode) => setParam("view", m === "coverage" ? null : m),
    [setParam],
  );

  // center the deep-linked node once the flow is ready
  const centeredOnce = useRef(false);
  const onInit = useCallback(() => {
    if (centeredOnce.current) return;
    centeredOnce.current = true;
    const initial = searchParams.get("node");
    if (!initial) return;
    const pos = positions.get(initial);
    if (!pos) return;
    setCenter(pos.x + NODE_W / 2, pos.y + NODE_H / 2, { zoom: 1.1, duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, setCenter]);

  const minimapColor = useCallback((n: { data?: unknown }) => {
    const data = n.data as PageNodeData | undefined;
    return data ? heatFor(data.stats, data.mode).color : "rgba(148,163,184,0.3)";
  }, []);

  const surf = useMemo(
    () => surfaceStats("enterprise"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  return (
    <div className="graph-canvas-wrap">
      <ReactFlow<PageNodeType, Edge>
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={noop}
        onInit={onInit}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(148, 163, 184, 0.12)"
        />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
          maskColor="var(--overlay)"
        />
      </ReactFlow>

      <motion.div
        className="graph-topstrip"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
      >
        <div className="gts-summary card">
          <div className="gts-summary-text">
            <span className="gts-surface">Enterprise:</span>
            <span className="num">{surf.coveredPct}%</span> covered
            <span className="gts-dot">·</span>
            <span className="num">{surf.automatedPct}%</span> automated
          </div>
          <div className="gts-track" title={`${surf.coveredPct}% of nodes covered`}>
            <ProgressBar value={surf.coveredPct} color="var(--accent)" />
          </div>
        </div>

        <div className="gts-mode card" role="tablist" aria-label="View mode">
          <button
            role="tab"
            aria-selected={mode === "coverage"}
            className={`gts-mode-btn ${mode === "coverage" ? "is-active" : ""}`}
            onClick={() => setMode("coverage")}
          >
            Coverage
          </button>
          <button
            role="tab"
            aria-selected={mode === "risk"}
            className={`gts-mode-btn ${mode === "risk" ? "is-active" : ""}`}
            onClick={() => setMode("risk")}
          >
            Risk
          </button>
        </div>

        <div className="gts-legend card">
          {LEGEND.map((item) => (
            <span key={item.label} className="gts-legend-item">
              <span className="gts-legend-dot" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedNode && (
          <NodePanel
            node={selectedNode}
            stats={statsById.get(selectedNode.id) ?? nodeStats(selectedNode.id)}
            onClose={() => selectNode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
