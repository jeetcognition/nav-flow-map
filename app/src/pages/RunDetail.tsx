import { ExternalLink } from "../components/ui/ExternalLink";
import { Fragment, useEffect, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  Copy,
  MagnifyingGlass,
  Robot,
  Sparkle,
} from "@phosphor-icons/react";
import {
  getNode,
  getRun,
  getRunResults,
  getSessions,
  getTestCase,
  userName,
} from "../data/dataService";
import { summarizeRun, type RunSummary } from "../data/aiService";
import { StatStrip } from "../components/ui/StatStrip";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonLines } from "../components/ui/SkeletonLines";
import { ResultBadge, SessionBadge } from "../components/ui/badges";
import { fadeUp, rowFadeUp } from "../lib/motion";
import { formatDate, formatDuration } from "../lib/format";
import type { Run } from "../types";
import "../styles/runs.css";

function RunStatusBadge({ status }: { status: Run["status"] }) {
  const cls =
    status === "passed" ? "badge-green" : status === "failed" ? "badge-red" : "badge-amber";
  const label = status === "running" ? "Running" : status === "passed" ? "Passed" : "Failed";
  return <span className={`badge ${cls}`}>{label}</span>;
}

/** fake log excerpt derived from the case's expected text */
function logExcerpt(caseId: string): string {
  const tc = getTestCase(caseId);
  const raw = (tc?.expected ?? "the expected state to hold").trim().replace(/\.\s*$/, "");
  const clipped = raw.length > 110 ? `${raw.slice(0, 110)}…` : raw;
  const lowered = clipped.charAt(0).toLowerCase() + clipped.slice(1);
  return [
    `FAIL  ${caseId} › ${tc?.title ?? "unknown case"}`,
    `AssertionError: expected ${lowered}`,
    `    at assertState (qa-runner/executor.ts:214:11)`,
    `    at async runCase (qa-runner/executor.ts:88:5)`,
    ``,
    `Retried 1x — same failure. Exit code 1.`,
  ].join("\n");
}

export default function RunDetail() {
  const { runId = "" } = useParams();
  const run = getRun(runId);

  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const runKey = run?.id;

  useEffect(() => {
    if (!runKey) return;
    let live = true;
    setSummary(null);
    summarizeRun(runKey).then((s) => {
      if (live) setSummary(s);
    });
    return () => {
      live = false;
    };
  }, [runKey]);

  if (!run) {
    return (
      <div className="page">
        <Link className="back-link" to="/runs">
          <ArrowLeft size={14} /> Runs
        </Link>
        <div className="card">
          <EmptyState
            icon={<MagnifyingGlass size={32} weight="duotone" />}
            title={`Run "${runId}" not found`}
            hint="It may have been pruned from history, or the link is stale."
            action={
              <Link className="btn" to="/runs">
                <ArrowLeft size={14} /> Back to Runs
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const results = getRunResults(run.id);
  const sorted = [...results].sort(
    (a, b) => (a.status === "failed" ? 0 : 1) - (b.status === "failed" ? 0 : 1),
  );
  const session = run.devinSessionId
    ? getSessions().find((s) => s.id === run.devinSessionId)
    : undefined;

  const toggleExpand = (caseId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(caseId)) next.add(caseId);
      return next;
    });

  const copyLink = () => {
    navigator.clipboard
      .writeText(location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };

  return (
    <div className="page">
      <motion.div {...fadeUp(0)}>
        <Link className="back-link" to="/runs">
          <ArrowLeft size={14} /> Runs
        </Link>
        <div className="page-head run-detail-head">
          <div>
            <div className="run-title-row">
              <h1 className="page-title mono">{run.id}</h1>
              <RunStatusBadge status={run.status} />
            </div>
            <div className="run-subline">
              <span>{run.suite}</span>
              <span className="sep">·</span>
              <span>{run.env}</span>
              <span className="sep">·</span>
              <span>{run.trigger}</span>
              <span className="sep">·</span>
              <span>{formatDate(run.startedAt)}</span>
              <span className="sep">·</span>
              <span className="num">{formatDuration(run.durationSec)}</span>
              <span className="sep">·</span>
              <span>triggered by {userName(run.triggeredBy)}</span>
            </div>
          </div>
          <div className="run-head-actions">
            {run.devinSessionId && (
              <ExternalLink
                className="devin-pill"
                href={`https://app.devin.ai/sessions/${run.devinSessionId}`}
              >
                <Robot size={16} weight="duotone" />
                <span className="mono">{run.devinSessionId}</span>
                {session && <SessionBadge status={session.status} />}
                <ArrowSquareOut size={14} />
              </ExternalLink>
            )}
            <button className="btn" onClick={copyLink}>
              {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="duotone" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div className="run-detail-stats" {...fadeUp(0.06)}>
        <StatStrip
          stats={[
            { label: "total", value: run.total },
            { label: "passed", value: run.passed, tone: "green" },
            { label: "failed", value: run.failed, tone: run.failed > 0 ? "red" : "default" },
            { label: "skipped", value: run.skipped },
            { label: "duration", value: formatDuration(run.durationSec) },
          ]}
        />
      </motion.div>

      <motion.div className="card ai-run-card" {...fadeUp(0.12)}>
        <div className="ai-run-card-head">
          <Sparkle size={16} weight="duotone" /> AI Run Summary
        </div>
        {summary === null ? (
          <SkeletonLines lines={3} />
        ) : (
          <>
            <p className="ai-headline">{summary.headline}</p>
            {summary.clusters.map((cluster) => (
              <div className="ai-cluster" key={cluster.cause}>
                <span className="ai-cluster-cause">{cluster.cause}</span>
                <span className="ai-chip-row">
                  {cluster.caseIds.map((id) => (
                    <span className="ai-chip" key={id}>
                      {id}
                    </span>
                  ))}
                </span>
              </div>
            ))}
            {summary.flaky.length > 0 && (
              <div className="ai-flaky-row">
                <span className="badge badge-amber">flaky</span>
                <span>Known-flaky signatures:</span>
                <span className="ai-chip-row">
                  {summary.flaky.map((id) => (
                    <span className="ai-chip" key={id}>
                      {id}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </>
        )}
      </motion.div>

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState title="No per-case results recorded for this run" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Title</th>
                <th>Node</th>
                <th>Result</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((res, i) => {
                const tc = getTestCase(res.caseId);
                const node = getNode(res.nodeId);
                const failed = res.status === "failed";
                const isOpen = expanded.has(res.caseId);
                const onKeyDown = failed
                  ? (e: KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleExpand(res.caseId);
                      }
                    }
                  : undefined;
                return (
                  <Fragment key={res.caseId}>
                    <motion.tr
                      className={failed ? "case-row--failed clickable" : ""}
                      role={failed ? "button" : undefined}
                      tabIndex={failed ? 0 : undefined}
                      aria-expanded={failed ? isOpen : undefined}
                      onClick={failed ? () => toggleExpand(res.caseId) : undefined}
                      onKeyDown={onKeyDown}
                      {...rowFadeUp(i, 0.03)}
                    >
                      <td className="mono">{res.caseId}</td>
                      <td>
                        <span className="case-title" title={tc?.title}>
                          {tc?.title ?? "—"}
                        </span>
                      </td>
                      <td>
                        <Link to={`/map?node=${res.nodeId}`} onClick={(e) => e.stopPropagation()}>
                          {node?.label ?? res.nodeId}
                        </Link>
                      </td>
                      <td>
                        <span className="result-badges">
                          <ResultBadge status={res.status} />
                          {tc?.flaky && <span className="badge badge-amber">flaky</span>}
                        </span>
                      </td>
                      <td className="num">{formatDuration(res.durationSec)}</td>
                    </motion.tr>
                    {failed && isOpen && (
                      <tr>
                        <td className="case-expand-cell" colSpan={5}>
                          <pre className="log-block">{logExcerpt(res.caseId)}</pre>
                          <div className="shot-strip-label">Screenshots (placeholder)</div>
                          <div className="shot-strip">
                            {[1, 2, 3].map((n) => (
                              <div className="shot-box" key={n}>
                                Screenshot {n}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
