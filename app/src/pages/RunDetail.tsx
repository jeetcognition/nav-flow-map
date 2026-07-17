import { ExternalLink } from "../components/ui/ExternalLink";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  Copy,
  MagnifyingGlass,
  Robot,
} from "@phosphor-icons/react";
import { getRun, getRunResults, getSessions, userName } from "../data/dataService";
import { summarizeRun, type RunSummary } from "../data/aiService";
import { StatStrip } from "../components/ui/StatStrip";
import { EmptyState } from "../components/ui/EmptyState";
import { SessionBadge } from "../components/ui/badges";
import { RunSummaryCard } from "../components/runs/RunSummaryCard";
import { RunResultsTable } from "../components/runs/RunResultsTable";
import { fadeUp } from "../lib/motion";
import { formatDate, formatDuration } from "../lib/format";
import { devinSessionUrl } from "../lib/config";
import type { Run } from "../types";
import "../styles/runs.css";

function RunStatusBadge({ status }: { status: Run["status"] }) {
  const cls =
    status === "passed" ? "badge-green" : status === "failed" ? "badge-red" : "badge-amber";
  const label = status === "running" ? "Running" : status === "passed" ? "Passed" : "Failed";
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function RunDetail() {
  const { runId = "" } = useParams();
  const run = getRun(runId);

  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const runKey = run?.id;

  useEffect(() => {
    if (!runKey) return;
    let live = true;
    setSummary(null);
    setSummaryError(null);
    summarizeRun(runKey)
      .then((s) => {
        if (live) setSummary(s);
      })
      .catch(() => {
        if (live) setSummaryError("The run summary failed to load — reload to retry.");
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
  const session = run.devinSessionId
    ? getSessions().find((s) => s.id === run.devinSessionId)
    : undefined;

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
              <ExternalLink className="devin-pill" href={devinSessionUrl(run.devinSessionId)}>
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

      <RunSummaryCard summary={summary} error={summaryError} />

      <RunResultsTable results={results} />
    </div>
  );
}
