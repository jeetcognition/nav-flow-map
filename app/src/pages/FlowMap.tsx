// NavFlow — the legacy nav-flow-map graph rebuilt on the new UI.
// Old foundation: collapsible top-to-bottom tree, split/graph/panel views,
// resizable side panel, add page / add link / edit / report bug, and the
// localStorage → Save to repo (worker) → AI promotion persistence flow.
// New skin: card nodes with coverage rings, Coverage/Risk heat toggle,
// parent-chain highlight, global ⌘K search instead of a graph search bar.
//
// Tree state lives in useNavTree, node/edge mapping in graphModel, the
// toolbar in FlowToolbar, and panel resizing in usePanelWidth.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import { nodeStats } from "../data/dataService";
import {
  extraLinks,
  hasLocalEdits,
  loadBaseline,
  resetLocalEdits,
  saveToRepo,
} from "../data/editsService";
import { usePanelWidth } from "../hooks/usePanelWidth";
import { layoutNodes } from "../components/graph/layout";
import { FlowNode, type FlowNodeType } from "../components/flow/FlowNode";
import { FlowPanel } from "../components/flow/FlowPanel";
import { FlowToolbar, type HeatMode, type LayoutMode } from "../components/flow/FlowToolbar";
import { useNavTree } from "../components/flow/useNavTree";
import { buildFlowEdges, buildFlowNodes } from "../components/flow/graphModel";
import { AddPageModal, AddLinkModal, ReportBugModal } from "../components/flow/dialogs";
import type { NavNode, NodeStats } from "../types";
import "@xyflow/react/dist/style.css";
import "../styles/flowmap.css";

const nodeTypes: NodeTypes = { flow: FlowNode };

export default function FlowMap() {
  return (
    <div className="flowmap-page">
      <ReactFlowProvider>
        <FlowMapInner />
      </ReactFlowProvider>
    </div>
  );
}

function FlowMapInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { fitView } = useReactFlow();

  useEffect(() => {
    void loadBaseline();
  }, []);

  // ---- selection (deep-linkable) ----
  const selectedId = searchParams.get("node");
  const caseParam = searchParams.get("case");
  const mode: HeatMode = searchParams.get("view") === "risk" ? "risk" : "coverage";

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

  const selectNode = useCallback(
    (id: string | null) => {
      setParam("node", id);
      if (!id) setParam("case", null);
    },
    [setParam],
  );

  // ---- tree + graph model ----
  const tree = useNavTree(selectedId);
  const { visiblePages, pathIds, selectedPage } = tree;

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

  // ---- layout mode + resizable panel ----
  const [layout, setLayout] = useState<LayoutMode>("split");
  const { panelW, onResizerDown, onResizerMove, onResizerUp, resetPanelW } = usePanelWidth();

  // ---- toolbar actions ----
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [reportBugFor, setReportBugFor] = useState<NavNode | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirty = useMemo(
    () => hasLocalEdits(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree.editsVersion],
  );

  const doSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const result = await saveToRepo();
      setSaveMsg(result.message);
      if (result.rewriteUrl) window.open(result.rewriteUrl, "_blank", "noopener");
    } catch (err) {
      setSaveMsg(`Save failed: ${err instanceof Error ? err.message : "network error"}`);
    } finally {
      setSaving(false);
    }
  };

  const doReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    resetLocalEdits();
    setConfirmReset(false);
    setSaveMsg("Local (unsaved) edits discarded. Edits already saved to the repo are kept.");
  };

  const panelVisible = layout !== "graph";
  const graphVisible = layout !== "panel";

  return (
    <div className="fm-root">
      <FlowToolbar
        layout={layout}
        mode={mode}
        dirty={dirty}
        saving={saving}
        confirmReset={confirmReset}
        onFit={() => fitView({ padding: 0.14, duration: 300 })}
        onLayout={setLayout}
        onMode={(m) => setParam("view", m === "coverage" ? null : m)}
        onAddPage={() => setAddPageOpen(true)}
        onAddLink={() => setAddLinkOpen(true)}
        onSave={doSave}
        onReset={doReset}
      />

      {saveMsg && (
        <div className="fm-banner" role="status">
          {saveMsg}
          <button className="fm-banner-close" onClick={() => setSaveMsg(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="fm-body">
        {graphVisible && (
          <div className="fm-graph">
            <ReactFlow<FlowNodeType, Edge>
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={nodeTypes}
              onNodesChange={() => {}}
              onNodeClick={(_, node) => selectNode(node.id)}
              onPaneClick={() => selectNode(null)}
              fitView
              fitViewOptions={{ padding: 0.14 }}
              minZoom={0.15}
              maxZoom={1.8}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color="rgba(148, 163, 184, 0.12)"
              />
              <Controls showInteractive={false} position="bottom-left" />
            </ReactFlow>
          </div>
        )}

        {panelVisible && graphVisible && (
          <div
            className="fm-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            onPointerDown={onResizerDown}
            onPointerMove={onResizerMove}
            onPointerUp={onResizerUp}
            onDoubleClick={resetPanelW}
          />
        )}

        {panelVisible && (
          <aside
            className="fm-panel"
            style={layout === "panel" ? undefined : { width: panelW }}
            aria-label="Details panel"
          >
            {selectedPage ? (
              <FlowPanel
                key={selectedPage.id}
                page={selectedPage}
                highlightCase={caseParam}
                onClose={() => selectNode(null)}
                onReportBug={() => setReportBugFor(selectedPage)}
              />
            ) : (
              <div className="fm-empty">
                <p>Select a page node to see its route, path, test cases and bugs.</p>
                <p className="fm-empty-hint">
                  Press <kbd>⌘K</kbd> to search pages and test cases.
                </p>
              </div>
            )}
          </aside>
        )}
      </div>

      <AddPageModal
        open={addPageOpen}
        onClose={() => setAddPageOpen(false)}
        onAdded={(id) => {
          setAddPageOpen(false);
          selectNode(id);
        }}
      />
      <AddLinkModal
        open={addLinkOpen}
        onClose={() => setAddLinkOpen(false)}
        onAdded={(targetId) => {
          setAddLinkOpen(false);
          selectNode(targetId);
        }}
      />
      <ReportBugModal
        page={reportBugFor}
        onClose={() => setReportBugFor(null)}
        onSaved={(pageId) => {
          setReportBugFor(null);
          selectNode(pageId);
        }}
      />
    </div>
  );
}
