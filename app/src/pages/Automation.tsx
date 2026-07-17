import { ExternalLink } from "../components/ui/ExternalLink";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowSquareOut,
  CaretDown,
  CaretUp,
  CheckCircle,
  Flask,
  Lightning,
  MagnifyingGlass,
  Play,
  Robot,
  Sparkle,
  TrendUp,
} from "@phosphor-icons/react";
import {
  getNodes,
  getSessions,
  getTestCases,
  nodeStats,
  triggerDevinSession,
} from "../data/dataService";
import { automationCandidates, coverageGapReport } from "../data/aiService";
import type { CoverageGap } from "../data/aiService";
import { useDataVersion } from "../hooks/useData";
import { EASE, rowFadeUp } from "../lib/motion";
import { StatStrip } from "../components/ui/StatStrip";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { SkeletonLines } from "../components/ui/SkeletonLines";
import { AutomationBadge, PriorityBadge, SessionBadge } from "../components/ui/badges";
import { pct, timeAgo } from "../lib/format";
import type { DevinSession, NavNode, NodeStats, TestCase } from "../types";
import "../styles/automation.css";

const SUITE_CLS: Record<TestCase["suite"], string> = {
  Sanity: "badge-blue",
  Regression: "badge-outline",
  Draft: "badge-gray",
};

/* ================= live sessions ================= */

function SessionsPanel({ sessions, index }: { sessions: DevinSession[]; index: number }) {
  const [showAll, setShowAll] = useState(false);
  const liveCount = sessions.filter((s) => s.status === "queued" || s.status === "running").length;
  const shown = showAll ? sessions : sessions.slice(0, 6);

  return (
    <motion.section className="card auto-section" {...rowFadeUp(index, 0.07)}>
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title">
            <Robot size={19} weight="duotone" /> Devin Sessions
          </h2>
          <div className="auto-card-sub">{sessions.length} total</div>
        </div>
        <span className="live-chip">
          {liveCount > 0 && <span className="pulse-dot" aria-hidden />}
          {liveCount} live
        </span>
      </div>
      {sessions.length === 0 ? (
        <EmptyState icon={<Robot size={28} weight="duotone" />} title="No sessions yet" hint="Trigger a run to spin up a Devin session." />
      ) : (
        <div className="sessions-list">
          {shown.map((s) => (
            <motion.div
              key={s.id}
              className={`session-row${s.status === "queued" || s.status === "running" ? " is-live" : ""}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <span className="session-id">{s.id}</span>
              <span className="session-scope" title={s.scope}>{s.scope}</span>
              <SessionBadge status={s.status} />
              <span className="session-time">{timeAgo(s.startedAt)}</span>
              <ExternalLink className="session-link" href={s.url} aria-label={`Open session ${s.id} in Devin`}>
                <ArrowSquareOut size={15} weight="duotone" />
              </ExternalLink>
            </motion.div>
          ))}
        </div>
      )}
      {sessions.length > 6 && (
        <button className="btn sessions-expander" onClick={() => setShowAll((v) => !v)}>
          {showAll ? (
            <>Show recent <CaretUp size={13} /></>
          ) : (
            <>Show all ({sessions.length}) <CaretDown size={13} /></>
          )}
        </button>
      )}
    </motion.section>
  );
}

/* ================= coverage by node ================= */

interface CovRow {
  node: NavNode;
  stats: NodeStats;
  autoPct: number;
}

function CoverageTable({ rows, index }: { rows: CovRow[]; index: number }) {
  return (
    <motion.section className="auto-section" {...rowFadeUp(index, 0.07)}>
      <div className="card card-flush">
        <div className="auto-card-head">
          <div>
            <h2 className="auto-card-title">
              <TrendUp size={19} weight="duotone" /> Coverage by Node
            </h2>
            <div className="auto-card-sub">Worst-automated flows first</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Node</th>
                <th>Group</th>
                <th className="num">Cases</th>
                <th className="num">Automated</th>
                <th>% Automated</th>
                <th className="num">Pass / Fail</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ node, stats, autoPct }) => (
                <tr key={node.id}>
                  <td>
                    <Link className="cov-node-link" to={`/map?node=${node.id}`}>{node.label}</Link>
                  </td>
                  <td><span className="badge badge-outline">{node.group}</span></td>
                  <td className="num">{stats.total}</td>
                  <td className="num">{stats.automated}</td>
                  <td>
                    <div className="cov-bar">
                      <ProgressBar value={autoPct} showLabel />
                    </div>
                  </td>
                  <td className="num">
                    <span className="pass-num">{stats.passing}</span>
                    <span className="dim-num"> / </span>
                    <span className={stats.failing > 0 ? "fail-num" : "dim-num"}>{stats.failing}</span>
                  </td>
                  <td>
                    <button
                      className="run-btn"
                      title={`Run node: ${node.label}`}
                      aria-label={`Run node: ${node.label}`}
                      onClick={() => triggerDevinSession(`Node: ${node.label}`, "enterprise")}
                    >
                      <Play size={14} weight="duotone" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}

/* ================= testcase explorer ================= */

const PAGE_SIZE = 50;

function CaseExplorer({
  cases,
  nodes,
  nodeLabel,
  caseParam,
  index,
}: {
  cases: TestCase[];
  nodes: NavNode[];
  nodeLabel: Map<string, string>;
  caseParam: string;
  index: number;
}) {
  const [suite, setSuite] = useState("all");
  const [auto, setAuto] = useState("all");
  const [prio, setPrio] = useState("all");
  const [nodeId, setNodeId] = useState("all");
  const [q, setQ] = useState(caseParam);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cases.filter(
      (c) =>
        (suite === "all" || c.suite === suite) &&
        (auto === "all" || c.automation === auto) &&
        (prio === "all" || c.priority === prio) &&
        (nodeId === "all" || c.nodeId === nodeId) &&
        (!term || c.id.toLowerCase().includes(term) || c.title.toLowerCase().includes(term))
    );
  }, [cases, suite, auto, prio, nodeId, q]);

  const shown = filtered.slice(0, limit);
  const resetPage = () => setLimit(PAGE_SIZE);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allShownSelected = shown.length > 0 && shown.every((c) => selected.has(c.id));
  const toggleAllShown = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) shown.forEach((c) => next.delete(c.id));
      else shown.forEach((c) => next.add(c.id));
      return next;
    });

  const runSelected = () => {
    triggerDevinSession(`${selected.size} selected cases`, "enterprise");
    setSelected(new Set());
  };

  return (
    <motion.section className="card auto-section" {...rowFadeUp(index, 0.07)}>
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title">
            <Flask size={19} weight="duotone" /> Testcase Explorer
          </h2>
          <div className="auto-card-sub">{filtered.length} of {cases.length} cases</div>
        </div>
        {selected.size > 0 && (
          <motion.button
            className="btn btn-primary"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={runSelected}
          >
            <Lightning size={15} weight="duotone" /> Run selected ({selected.size})
          </motion.button>
        )}
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <MagnifyingGlass size={14} weight="duotone" />
          <input
            type="search"
            placeholder="Search by case ID or title…"
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage(); }}
            aria-label="Search testcases"
          />
        </div>
        <select value={suite} onChange={(e) => { setSuite(e.target.value); resetPage(); }} aria-label="Filter by suite">
          <option value="all">All suites</option>
          <option value="Sanity">Sanity</option>
          <option value="Regression">Regression</option>
          <option value="Draft">Draft</option>
        </select>
        <select value={auto} onChange={(e) => { setAuto(e.target.value); resetPage(); }} aria-label="Filter by automation status">
          <option value="all">All automation</option>
          <option value="automated">Automated</option>
          <option value="manual">Manual</option>
          <option value="in-progress">In Progress</option>
          <option value="not-automatable">Not Automatable</option>
        </select>
        <select value={prio} onChange={(e) => { setPrio(e.target.value); resetPage(); }} aria-label="Filter by priority">
          <option value="all">All priorities</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
        </select>
        <select value={nodeId} onChange={(e) => { setNodeId(e.target.value); resetPage(); }} aria-label="Filter by node">
          <option value="all">All nodes</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>{n.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Flask size={28} weight="duotone" />}
          title="No cases match these filters"
          hint="Try widening the suite, status, or search term."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 34 }}>
                  <input
                    type="checkbox"
                    className="tc-check"
                    checked={allShownSelected}
                    onChange={toggleAllShown}
                    aria-label="Select all visible cases"
                  />
                </th>
                <th>Case ID</th>
                <th>Title</th>
                <th>Node</th>
                <th>Suite</th>
                <th>Priority</th>
                <th>Automation</th>
                <th>Flags</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className={c.id === caseParam ? "row-hl" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      className="tc-check"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`Select ${c.id}`}
                    />
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>{c.id}</td>
                  <td><span className="tc-title" title={c.title}>{c.title}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>{nodeLabel.get(c.nodeId) ?? c.nodeId}</td>
                  <td><span className={`badge ${SUITE_CLS[c.suite]}`}>{c.suite}</span></td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td><AutomationBadge status={c.automation} /></td>
                  <td>
                    <span className="tc-badges">
                      {c.flaky && <span className="badge badge-amber">Flaky</span>}
                      {(c.source === "ai-from-incident" || c.source === "ai-suggested") && (
                        <span className="badge badge-purple">AI</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <button
                      className="run-btn"
                      title={`Run case ${c.id}`}
                      aria-label={`Run case ${c.id}`}
                      onClick={() => triggerDevinSession(`Case: ${c.id}`, "enterprise")}
                    >
                      <Play size={14} weight="duotone" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-foot">
            <span className="num">Showing {shown.length} of {filtered.length}</span>
            {filtered.length > limit && (
              <button className="btn" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                <CaretDown size={13} /> Load more
              </button>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}

/* ================= AI insights ================= */

function riskCls(risk: number): string {
  if (risk > 6) return "risk-high";
  if (risk >= 4) return "risk-med";
  return "risk-low";
}

function CoverageGapCard() {
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<CoverageGap[] | null>(null);

  const generate = async () => {
    setLoading(true);
    setGaps(await coverageGapReport());
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title ai">
            <Sparkle size={19} weight="duotone" /> Where is coverage lagging?
          </h2>
          <div className="auto-card-sub">Risk-ranked nodes from bugs, incidents, and automation gaps</div>
        </div>
        <button className="btn btn-ai" onClick={generate} disabled={loading}>
          <Sparkle size={15} weight="duotone" /> {gaps ? "Regenerate" : "Generate"}
        </button>
      </div>
      {loading ? (
        <SkeletonLines lines={5} />
      ) : gaps === null ? (
        <EmptyState
          icon={<Sparkle size={26} weight="duotone" />}
          title="No report yet"
          hint="Generate to rank the riskiest under-covered flows."
        />
      ) : gaps.length === 0 ? (
        <EmptyState icon={<CheckCircle size={26} weight="duotone" />} title="No significant gaps found" />
      ) : (
        <div className="gap-list">
          {gaps.map((g, i) => (
            <motion.div key={g.nodeId} className="gap-item" {...rowFadeUp(i, 0.05)}>
              <span className="gap-rank">{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <Link className="cov-node-link gap-label" to={`/map?node=${g.nodeId}`}>{g.label}</Link>
                <div className="gap-reason">{g.reason}</div>
              </div>
              <span className={`risk-chip ${riskCls(g.risk)}`}>{g.risk.toFixed(1)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidatesCard() {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<TestCase[] | null>(null);

  const generate = async () => {
    setLoading(true);
    setCandidates(await automationCandidates());
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title ai">
            <Robot size={19} weight="duotone" /> Automation candidates
          </h2>
          <div className="auto-card-sub">Manual P1 cases worth automating next</div>
        </div>
        <button className="btn btn-ai" onClick={generate} disabled={loading}>
          <Sparkle size={15} weight="duotone" /> {candidates ? "Regenerate" : "Generate"}
        </button>
      </div>
      {loading ? (
        <SkeletonLines lines={5} />
      ) : candidates === null ? (
        <EmptyState
          icon={<Robot size={26} weight="duotone" />}
          title="No suggestions yet"
          hint="Generate to surface the best automation targets."
        />
      ) : candidates.length === 0 ? (
        <EmptyState icon={<CheckCircle size={26} weight="duotone" />} title="Nothing left to automate" />
      ) : (
        <>
          <div className="ai-hint">High-value, frequently run, stable flows</div>
          <div className="cand-list">
            {candidates.map((c, i) => (
              <motion.div key={c.id} className="cand-item" {...rowFadeUp(i, 0.05)}>
                <span className="cand-id">{c.id}</span>
                <span className="cand-title" title={c.title}>{c.title}</span>
                <PriorityBadge priority={c.priority} />
                <button
                  className="run-btn"
                  title={`Run case ${c.id}`}
                  aria-label={`Run case ${c.id}`}
                  onClick={() => triggerDevinSession(`Case: ${c.id}`, "enterprise")}
                >
                  <Play size={14} weight="duotone" />
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= page ================= */

export default function Automation() {
  const version = useDataVersion();
  const [params] = useSearchParams();
  const caseParam = params.get("case") ?? "";

  const cases = getTestCases();
  const sessions = getSessions();

  const { counts, covRows, nodesWithCases, nodeLabel } = useMemo(() => {
    const all = getTestCases();
    const counts = {
      total: all.length,
      automated: all.filter((c) => c.automation === "automated").length,
      inProgress: all.filter((c) => c.automation === "in-progress").length,
      notAutomatable: all.filter((c) => c.automation === "not-automatable").length,
    };
    const nodeLabel = new Map<string, string>();
    const covRows: CovRow[] = [];
    for (const node of getNodes()) {
      nodeLabel.set(node.id, node.label);
      const stats = nodeStats(node.id);
      if (stats.total > 0) covRows.push({ node, stats, autoPct: pct(stats.automated, stats.total) });
    }
    covRows.sort((a, b) => a.autoPct - b.autoPct || b.stats.total - a.stats.total);
    const nodesWithCases = covRows
      .map((r) => r.node)
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label));
    return { counts, covRows, nodesWithCases, nodeLabel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const passing = covRows.reduce((s, r) => s + r.stats.passing, 0);
  const failing = covRows.reduce((s, r) => s + r.stats.failing, 0);
  const passingPct = pct(passing, passing + failing);

  const hasLive = sessions.some((s) => s.status === "queued" || s.status === "running");

  return (
    <div className="page">
      <motion.div className="page-head" {...rowFadeUp(0, 0.07)}>
        <div>
          <h1 className="page-title">Automation</h1>
          <p className="page-sub">
            Start with the least-automated nodes below — or ask the AI where coverage is riskiest.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => triggerDevinSession("Full Enterprise suite", "enterprise")}
        >
          <Play size={15} weight="duotone" /> Run full suite
        </button>
      </motion.div>

      <motion.div className="auto-section" {...rowFadeUp(1, 0.07)}>
        <StatStrip
          stats={[
            { label: "Total cases", value: counts.total },
            {
              label: "Automated",
              value: `${counts.automated} · ${pct(counts.automated, counts.total)}%`,
              tone: "green",
            },
            { label: "In progress", value: counts.inProgress, tone: "amber" },
            { label: "Not automatable", value: counts.notAutomatable },
            {
              label: "Passing",
              value: `${passingPct}%`,
              tone: passingPct >= 90 ? "green" : passingPct >= 75 ? "amber" : "red",
            },
          ]}
        />
      </motion.div>

      {hasLive && <SessionsPanel sessions={sessions} index={2} />}

      <CoverageTable rows={covRows} index={hasLive ? 3 : 2} />

      <motion.section className="ai-grid auto-section" {...rowFadeUp(hasLive ? 4 : 3, 0.07)}>
        <CoverageGapCard />
        <CandidatesCard />
      </motion.section>

      {!hasLive && <SessionsPanel sessions={sessions} index={4} />}

      <CaseExplorer
        cases={cases}
        nodes={nodesWithCases}
        nodeLabel={nodeLabel}
        caseParam={caseParam}
        index={5}
      />
    </div>
  );
}
