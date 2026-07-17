// NavFlow — the legacy nav-flow-map graph rebuilt on the new UI.
// Old foundation: collapsible top-to-bottom tree, split/graph/panel views,
// resizable side panel, add page / add link / edit / report bug, and the
// localStorage → Save to repo (worker) → AI promotion persistence flow.
// New skin: card nodes with coverage rings, Coverage/Risk heat toggle,
// parent-chain highlight, global ⌘K search instead of a graph search bar.
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
import {
  ArrowsInSimple,
  Bug as BugIcon,
  CornersOut,
  FloppyDisk,
  LinkSimple,
  Plus,
  SquareHalf,
  SquaresFour,
  Trash,
} from "@phosphor-icons/react";
import { nodeStats } from "../data/dataService";
import {
  allPages,
  extraLinks,
  hasLocalEdits,
  loadBaseline,
  resetLocalEdits,
  saveToRepo,
} from "../data/editsService";
import { useDataVersion } from "../hooks/useData";
import { useEditsVersion } from "../hooks/useEdits";
import { readStorage, writeStorage } from "../lib/storage";
import { layoutNodes } from "../components/graph/layout";
import { FlowNode, type FlowNodeType } from "../components/flow/FlowNode";
import { FlowPanel } from "../components/flow/FlowPanel";
import { AllBugsPanel } from "../components/flow/AllBugsPanel";
import { AddPageModal, AddLinkModal, ReportBugModal } from "../components/flow/dialogs";
import type { NavNode, NodeStats } from "../types";
import "@xyflow/react/dist/style.css";
import "../styles/flowmap.css";

const nodeTypes: NodeTypes = { flow: FlowNode };

const EXPANDED_KEY = "navflow-expanded-v1";
const PANEL_W_KEY = "navmap-panel-width";
const DEFAULT_VISIBLE_LAYERS = 4;
const PANEL_MIN = 260;
const PANEL_DEFAULT = 460;

type LayoutMode = "split" | "graph" | "panel";
type HeatMode = "coverage" | "risk";

const LEGEND: { color: string; label: string }[] = [
  { color: "var(--heat-covered)", label: "Covered" },
  { color: "var(--heat-partial)", label: "Partial" },
  { color: "var(--heat-uncovered)", label: "Uncovered" },
];

function depthOf(page: NavNode, byId: Map<string, NavNode>): number {
  let d = 0;
  let cur = page;
  const seen = new Set<string>();
  while (cur.parent && byId.has(cur.parent) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.parent)!;
    d++;
  }
  return d;
}

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
  const dataVersion = useDataVersion();
  const editsVersion = useEditsVersion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fitView } = useReactFlow();

  useEffect(() => {
    void loadBaseline();
  }, []);

  // ---- pages + tree shape ----
  const pages = useMemo(
    () => allPages(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataVersion, editsVersion],
  );
  const byId = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);
  const childrenOf = useMemo(() => {
    const m = new Map<string, NavNode[]>();
    for (const p of pages) {
      if (!p.parent || !byId.has(p.parent)) continue;
      m.set(p.parent, [...(m.get(p.parent) ?? []), p]);
    }
    return m;
  }, [pages, byId]);

  // ---- branch expand/collapse (old behavior: first 4 layers open, persisted) ----
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const raw = readStorage(EXPANDED_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
      // corrupted → fall through to defaults
    }
    return new Set();
  });
  const [expandedInitialized, setExpandedInitialized] = useState(() =>
    Boolean(readStorage(EXPANDED_KEY)),
  );

  useEffect(() => {
    if (expandedInitialized || pages.length === 0) return;
    const initial = new Set<string>();
    for (const p of pages) {
      if (childrenOf.has(p.id) && depthOf(p, byId) < DEFAULT_VISIBLE_LAYERS - 1) initial.add(p.id);
    }
    setExpanded(initial);
    setExpandedInitialized(true);
  }, [expandedInitialized, pages, childrenOf, byId]);

  const persistExpanded = useCallback((next: Set<string>) => {
    writeStorage(EXPANDED_KEY, JSON.stringify([...next]));
  }, []);

  const toggleBranch = useCallback(
    (id: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persistExpanded(next);
        return next;
      });
    },
    [persistExpanded],
  );

  // ---- selection (deep-linkable) ----
  const selectedId = searchParams.get("node");
  const selectedPage = selectedId ? (byId.get(selectedId) ?? null) : null;
  const caseParam = searchParams.get("case");
  const mode: HeatMode = searchParams.get("view") === "risk" ? "risk" : "coverage";
  const [allBugsOpen, setAllBugsOpen] = useState(false);

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
      if (id) setAllBugsOpen(false);
      setParam("node", id);
      if (!id) setParam("case", null);
    },
    [setParam],
  );

  // reveal a hidden selected node by expanding its ancestor chain (search jumps)
  useEffect(() => {
    if (!selectedPage) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      let cur = selectedPage;
      const seen = new Set<string>();
      while (cur.parent && byId.has(cur.parent) && !seen.has(cur.id)) {
        seen.add(cur.id);
        if (!next.has(cur.parent)) {
          next.add(cur.parent);
          changed = true;
        }
        cur = byId.get(cur.parent)!;
      }
      if (changed) persistExpanded(next);
      return changed ? next : prev;
    });
  }, [selectedPage, byId, persistExpanded]);

  // ---- visible subtree ----
  const visiblePages = useMemo(() => {
    const roots = pages.filter((p) => !p.parent || !byId.has(p.parent));
    const out: NavNode[] = [];
    const walk = (p: NavNode) => {
      out.push(p);
      if (!expanded.has(p.id)) return;
      for (const c of childrenOf.get(p.id) ?? []) walk(c);
    };
    for (const r of roots) walk(r);
    return out;
  }, [pages, byId, childrenOf, expanded]);

  const descendantCount = useCallback(
    (id: string): number => {
      let n = 0;
      const walk = (pid: string) => {
        for (const c of childrenOf.get(pid) ?? []) {
          n++;
          walk(c.id);
        }
      };
      walk(id);
      return n;
    },
    [childrenOf],
  );

  // ---- parent chain of the selection ----
  const pathIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedPage) return set;
    let cur: NavNode | undefined = selectedPage;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      set.add(cur.id);
      cur = cur.parent ? byId.get(cur.parent) : undefined;
    }
    return set;
  }, [selectedPage, byId]);

  // ---- stats / layout / react-flow graph ----
  const statsById = useMemo(() => {
    const m = new Map<string, NodeStats>();
    for (const p of visiblePages) m.set(p.id, nodeStats(p.id));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePages, dataVersion]);

  const positions = useMemo(() => layoutNodes(visiblePages), [visiblePages]);

  const rfNodes = useMemo<FlowNodeType[]>(
    () =>
      visiblePages.map((p) => {
        const hasKids = childrenOf.has(p.id);
        const collapsedCount = hasKids ? (expanded.has(p.id) ? -1 : descendantCount(p.id)) : 0;
        return {
          id: p.id,
          type: "flow" as const,
          position: positions.get(p.id) ?? { x: 0, y: 0 },
          data: {
            nav: p,
            stats: statsById.get(p.id) ?? nodeStats(p.id),
            mode,
            collapsedCount,
            onPath: pathIds.has(p.id) && p.id !== selectedId,
            dimmed: pathIds.size > 0 && !pathIds.has(p.id),
            onToggleBranch: toggleBranch,
          },
          selected: p.id === selectedId,
          draggable: false,
          connectable: false,
        };
      }),
    [
      visiblePages,
      childrenOf,
      expanded,
      descendantCount,
      positions,
      statsById,
      mode,
      pathIds,
      selectedId,
      toggleBranch,
    ],
  );

  const rfEdges = useMemo<Edge[]>(() => {
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
    const extras: Edge[] = extraLinks()
      .filter((l) => visible.has(l.source) && visible.has(l.target))
      .map((l) => ({
        id: `x-${l.source}-${l.target}`,
        source: l.source,
        target: l.target,
        type: "smoothstep",
        label: undefined,
        style: {
          stroke: "var(--ai)",
          strokeWidth: 1.6,
          strokeDasharray: "7 5",
          opacity: pathIds.size > 0 ? 0.45 : 0.9,
        },
      }));
    return [...treeEdges, ...extras];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePages, pathIds, editsVersion]);

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
  const [panelW, setPanelW] = useState(() => {
    const saved = parseInt(readStorage(PANEL_W_KEY) ?? "", 10);
    return Number.isFinite(saved) && saved > 0
      ? Math.min(Math.max(saved, PANEL_MIN), window.innerWidth - 200)
      : PANEL_DEFAULT;
  });
  const dragState = useRef<{ startX: number; startW: number } | null>(null);

  const onResizerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = { startX: e.clientX, startW: panelW };
    },
    [panelW],
  );
  const onResizerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const w = Math.min(
      Math.max(dragState.current.startW + (dragState.current.startX - e.clientX), PANEL_MIN),
      window.innerWidth - 200,
    );
    setPanelW(w);
  }, []);
  const onResizerUp = useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    setPanelW((w) => {
      writeStorage(PANEL_W_KEY, String(w));
      return w;
    });
  }, []);
  const resetPanelW = useCallback(() => {
    setPanelW(PANEL_DEFAULT);
    writeStorage(PANEL_W_KEY, String(PANEL_DEFAULT));
  }, []);

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
    [editsVersion],
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
  const showNodePanel = allBugsOpen ? false : selectedPage !== null;

  return (
    <div className="fm-root">
      <div className="fm-toolbar">
        <div className="fm-tools">
          <button
            className="btn fm-btn"
            onClick={() => fitView({ padding: 0.14, duration: 300 })}
            title="Fit view"
          >
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
                onClick={() => setLayout(key)}
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
                onClick={() => setParam("view", m === "coverage" ? null : m)}
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
          <button className="btn fm-btn" onClick={() => setAddPageOpen(true)}>
            <Plus size={13} weight="bold" /> Add page
          </button>
          <button className="btn fm-btn" onClick={() => setAddLinkOpen(true)}>
            <LinkSimple size={13} weight="bold" /> Add link
          </button>
          <button
            className={`btn fm-btn fm-bugs-btn ${allBugsOpen ? "is-active" : ""}`}
            onClick={() => {
              setAllBugsOpen((v) => !v);
              if (layout === "graph") setLayout("split");
            }}
          >
            <BugIcon size={13} weight="bold" /> Bugs
          </button>
          <button
            className="btn btn-primary fm-btn"
            disabled={!dirty || saving}
            title={dirty ? "Commit edits to the repo" : "No unsaved edits"}
            onClick={doSave}
          >
            <FloppyDisk size={13} weight="bold" /> {saving ? "Saving…" : "Save to repo"}
          </button>
          <button
            className={`btn fm-btn ${confirmReset ? "fm-btn-danger" : ""}`}
            disabled={!dirty}
            title="Discard local (unsaved) edits"
            onClick={doReset}
          >
            <Trash size={13} weight="bold" /> {confirmReset ? "Confirm reset?" : "Reset"}
          </button>
        </div>
      </div>

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
            {allBugsOpen ? (
              <AllBugsPanel
                onClose={() => setAllBugsOpen(false)}
                onJump={(pageId) => {
                  setAllBugsOpen(false);
                  selectNode(pageId);
                }}
              />
            ) : showNodePanel && selectedPage ? (
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
