import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowSquareOut,
  Bug as BugIcon,
  Check,
  ClockCounterClockwise,
  Fire,
  ListChecks,
  Path,
  Play,
  Plus,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import {
  addTestCase,
  getBugs,
  getIncidents,
  getRunResults,
  getRuns,
  getSessions,
  getTestCases,
  newId,
  triggerDevinSession,
} from "../../data/dataService";
import { suggestMissingCases } from "../../data/aiService";
import { useDataVersion } from "../../hooks/useData";
import { useApp } from "../../hooks/useApp";
import { EASE } from "../../lib/motion";
import { pct } from "../../lib/format";
import { ProgressRing } from "../ui/ProgressRing";
import { SkeletonLines } from "../ui/SkeletonLines";
import { AutomationBadge, PriorityBadge, SessionBadge, SeverityBadge } from "../ui/badges";
import type { NavNode, NodeStats, Run } from "../../types";

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 859px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 859px)");
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

const COVERAGE_BADGE: Record<NodeStats["coverage"], [string, string]> = {
  covered: ["Covered", "badge-green"],
  partial: ["Partial", "badge-amber"],
  uncovered: ["Uncovered", "badge-red"],
};

interface Props {
  node: NavNode;
  stats: NodeStats;
  onClose: () => void;
}

export function NodePanel({ node, stats, onClose }: Props) {
  const isMobile = useIsMobile();
  return (
    <motion.aside
      className="node-panel"
      role="dialog"
      aria-label={`${node.label} details`}
      initial={isMobile ? { y: "100%" } : { x: 400, opacity: 0.6 }}
      animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
      exit={isMobile ? { y: "100%" } : { x: 400, opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {/* key by node id so per-node state (AI drafts, session) resets on switch */}
      <PanelBody key={node.id} node={node} stats={stats} onClose={onClose} />
    </motion.aside>
  );
}

function PanelBody({ node, stats, onClose }: Props) {
  const version = useDataVersion();
  const { user } = useApp();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const session = sessionId ? getSessions().find((s) => s.id === sessionId) : undefined;

  const cases = useMemo(
    () => getTestCases().filter((c) => c.nodeId === node.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.id, version],
  );
  const bugs = useMemo(
    () => getBugs().filter((b) => b.nodeId === node.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.id, version],
  );
  const incidents = useMemo(
    () => getIncidents().filter((i) => i.nodeId === node.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.id, version],
  );

  const lastRun = useMemo((): { run: Run; passed: number; failed: number } | null => {
    const runs = [...getRuns()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    for (const run of runs) {
      const mine = getRunResults(run.id).filter((r) => r.nodeId === node.id);
      if (mine.length > 0) {
        return {
          run,
          passed: mine.filter((r) => r.status === "passed").length,
          failed: mine.filter((r) => r.status === "failed").length,
        };
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, version]);

  const [covLabel, covCls] = COVERAGE_BADGE[stats.coverage];
  const autoPct = pct(stats.automated, stats.total);

  const runAutomation = () => {
    if (session && session.status !== "done" && session.status !== "failed") return;
    const s = triggerDevinSession(`Node: ${node.label}`, "enterprise");
    setSessionId(s.id);
  };

  const suggest = async () => {
    setAiLoading(true);
    setSuggestions(null);
    setAdded(new Set());
    try {
      const result = await suggestMissingCases(node.id);
      setSuggestions(result);
    } finally {
      setAiLoading(false);
    }
  };

  const addSuggestion = (title: string) => {
    if (added.has(title)) return;
    addTestCase({
      id: newId(`AI-${node.id.toUpperCase()}`),
      title,
      surfaceId: "enterprise",
      nodeId: node.id,
      suite: "Draft",
      priority: "P2",
      reach: "",
      steps: title,
      expected: "Behavior verified",
      automation: "manual",
      flaky: false,
      createdBy: user.id,
      source: "ai-suggested",
    });
    setAdded((prev) => new Set(prev).add(title));
  };

  return (
    <>
      <header className="np-head">
        <div className="np-head-text">
          <div className="np-title-row">
            <h2 className="np-title">{node.label}</h2>
            <span className={`badge badge-outline np-group-badge np-group-${node.group}`}>
              {node.group}
            </span>
          </div>
          <div className="np-route mono">{node.route}</div>
          {node.via && (
            <div className="np-via">
              <Path size={13} weight="duotone" />
              <span>{node.via}</span>
            </div>
          )}
        </div>
        <button className="np-close" onClick={onClose} aria-label="Close panel">
          <X size={16} weight="bold" />
        </button>
      </header>

      <div className="np-scroll">
        <div className="np-stats-row">
          <span className={`badge ${covCls}`}>{covLabel}</span>
          <span className="np-stat mono">
            <span className="np-stat-num">
              {stats.passing}/{stats.total}
            </span>{" "}
            passing
          </span>
          <span className="np-stat-ring" title={`${autoPct}% automated`}>
            <ProgressRing
              value={stats.total ? autoPct : 0}
              size={30}
              stroke={3}
              color={stats.total ? "var(--accent)" : "var(--text-3)"}
              label={`${autoPct}% automated`}
            />
            <span className="np-stat-cap">automated</span>
          </span>
        </div>

        <div className="np-run">
          <button
            className="btn btn-primary np-run-btn"
            onClick={runAutomation}
            disabled={!!session && (session.status === "queued" || session.status === "running")}
          >
            <Play size={15} weight="duotone" />
            Run automation for this node
          </button>
          {session && (
            <div className="np-session">
              <SessionBadge status={session.status} />
              <span className="mono np-session-id">{session.id}</span>
            </div>
          )}
        </div>

        <section className="np-section">
          <h3 className="np-section-title">
            <ListChecks size={15} weight="duotone" />
            Testcases <span className="np-count mono">{cases.length}</span>
          </h3>
          {cases.length === 0 ? (
            <p className="np-empty">No testcases mapped to this node yet.</p>
          ) : (
            <ul className="np-list np-case-list">
              {cases.map((c) => (
                <li key={c.id} className="np-row">
                  <span className="np-row-id mono">{c.id}</span>
                  <span className="np-row-title" title={c.title}>
                    {c.title}
                  </span>
                  <span className="np-row-badges">
                    <AutomationBadge status={c.automation} />
                    <PriorityBadge priority={c.priority} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="np-section">
          <h3 className="np-section-title">
            <BugIcon size={15} weight="duotone" />
            Bugs <span className="np-count mono">{bugs.length}</span>
          </h3>
          {bugs.length === 0 ? (
            <p className="np-empty">No bugs filed against this node.</p>
          ) : (
            <ul className="np-list">
              {bugs.map((b) => (
                <li key={b.id} className="np-row">
                  <SeverityBadge severity={b.severity} />
                  <Link to={`/bugs/${b.id}`} className="np-row-link" title={b.title}>
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="np-section">
          <h3 className="np-section-title">
            <Fire size={15} weight="duotone" />
            Incidents <span className="np-count mono">{incidents.length}</span>
          </h3>
          {incidents.length === 0 ? (
            <p className="np-empty">No incidents reported here.</p>
          ) : (
            <ul className="np-list">
              {incidents.map((i) => (
                <li key={i.id} className="np-row">
                  <SeverityBadge severity={i.severity} />
                  <Link to={`/incidents/${i.id}`} className="np-row-link" title={i.title}>
                    {i.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="np-section">
          <h3 className="np-section-title">
            <ClockCounterClockwise size={15} weight="duotone" />
            Last run
          </h3>
          {lastRun ? (
            <div className="np-lastrun">
              <Link to={`/runs/${lastRun.run.id}`} className="mono np-lastrun-link">
                {lastRun.run.id}
                <ArrowSquareOut size={13} weight="duotone" />
              </Link>
              <span className="np-lastrun-counts mono">
                <span className="np-pass">{lastRun.passed} passed</span>
                {" · "}
                <span className={lastRun.failed > 0 ? "np-fail" : ""}>{lastRun.failed} failed</span>
              </span>
            </div>
          ) : (
            <p className="np-empty">This node has not appeared in any run yet.</p>
          )}
        </section>

        <section className="np-section np-ai">
          <h3 className="np-section-title np-ai-title">
            <Sparkle size={15} weight="duotone" />
            AI coverage assistant
          </h3>
          <button className="btn btn-ai np-ai-btn" onClick={suggest} disabled={aiLoading}>
            <Sparkle size={15} weight="duotone" />
            {aiLoading ? "Thinking…" : "Suggest missing testcases"}
          </button>

          {aiLoading && <SkeletonLines lines={3} />}

          {suggestions && (
            <ul className="np-list np-drafts">
              {suggestions.map((s) => {
                const isAdded = added.has(s);
                return (
                  <li key={s} className={`np-draft ${isAdded ? "is-added" : ""}`}>
                    <span className="np-draft-title">{s}</span>
                    {isAdded ? (
                      <span className="np-draft-added">
                        <Check size={14} weight="bold" />
                        Added
                      </span>
                    ) : (
                      <button className="btn np-draft-add" onClick={() => addSuggestion(s)}>
                        <Plus size={13} weight="bold" />
                        Add
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
