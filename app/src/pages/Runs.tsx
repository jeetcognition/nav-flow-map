import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FunnelSimple, Robot } from "@phosphor-icons/react";
import { getRuns, userName } from "../data/dataService";
import { StatStrip } from "../components/ui/StatStrip";
import { EmptyState } from "../components/ui/EmptyState";
import { EnvBadge } from "../components/ui/badges";
import { ProgressBar } from "../components/ui/ProgressBar";
import { fadeUp, rowFadeUp } from "../lib/motion";
import { formatDate, formatDuration, pct, timeAgo } from "../lib/format";
import type { Run } from "../types";
import "../styles/runs.css";

const SUITES = ["All", "Sanity", "Regression"] as const;
const ENVS = ["All", "staging", "beta"] as const;
const STATUSES = ["All", "passed", "failed"] as const;
const TRIGGERS = ["All", "manual", "release", "nightly", "devin-session"] as const;
const RANGES = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

const DAY_MS = 86_400_000;

export default function Runs() {
  const navigate = useNavigate();
  const runs = getRuns();

  const [suite, setSuite] = useState<string>("All");
  const [env, setEnv] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [trigger, setTrigger] = useState<string>("All");
  const [range, setRange] = useState<string>("all");

  const hasFilters =
    suite !== "All" || env !== "All" || status !== "All" || trigger !== "All" || range !== "all";

  const resetFilters = () => {
    setSuite("All");
    setEnv("All");
    setStatus("All");
    setTrigger("All");
    setRange("all");
  };

  const filtered = useMemo(() => {
    const cutoff =
      range === "7d" ? Date.now() - 7 * DAY_MS : range === "30d" ? Date.now() - 30 * DAY_MS : 0;
    return runs
      .filter((r) => suite === "All" || r.suite === suite)
      .filter((r) => env === "All" || r.env === env)
      .filter((r) => status === "All" || r.status === status)
      .filter((r) => trigger === "All" || r.trigger === trigger)
      .filter((r) => cutoff === 0 || new Date(r.startedAt).getTime() >= cutoff)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [runs, suite, env, status, trigger, range]);

  const stats = useMemo(() => {
    const totalCases = runs.reduce((s, r) => s + r.total, 0);
    const passedCases = runs.reduce((s, r) => s + r.passed, 0);
    const latest = runs.reduce<Run | null>(
      (acc, r) => (acc === null || r.startedAt > acc.startedAt ? r : acc),
      null,
    );
    const avgSec = runs.length
      ? Math.round(runs.reduce((s, r) => s + r.durationSec, 0) / runs.length)
      : 0;
    return {
      total: runs.length,
      passRate: pct(passedCases, totalCases),
      lastRun: latest ? timeAgo(latest.startedAt) : "—",
      lastRunHint: latest ? formatDate(latest.startedAt) : undefined,
      avgDuration: formatDuration(avgSec),
    };
  }, [runs]);

  return (
    <div className="page">
      <motion.div className="page-head" {...fadeUp(0)}>
        <div>
          <h1 className="page-title">Runs</h1>
          <p className="page-sub">Open a failing run to see what broke and why.</p>
        </div>
      </motion.div>

      <motion.div className="runs-stats" {...fadeUp(0.05)} title={stats.lastRunHint}>
        <StatStrip
          stats={[
            { label: "total runs", value: stats.total },
            {
              label: "pass rate",
              value: `${stats.passRate}%`,
              tone: stats.passRate >= 90 ? "green" : "amber",
            },
            { label: "last run", value: stats.lastRun },
            { label: "avg duration", value: stats.avgDuration },
          ]}
        />
      </motion.div>

      <motion.div className="card runs-filterbar" {...fadeUp(0.1)}>
        <div className="runs-filter">
          <label htmlFor="f-suite">Suite</label>
          <select id="f-suite" value={suite} onChange={(e) => setSuite(e.target.value)}>
            {SUITES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="runs-filter">
          <label htmlFor="f-env">Env</label>
          <select id="f-env" value={env} onChange={(e) => setEnv(e.target.value)}>
            {ENVS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="runs-filter">
          <label htmlFor="f-status">Status</label>
          <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="runs-filter">
          <label htmlFor="f-trigger">Trigger</label>
          <select id="f-trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            {TRIGGERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="runs-filter">
          <label htmlFor="f-range">Date range</label>
          <select id="f-range" value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="runs-filter-count num">
          {filtered.length} of {runs.length} runs
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FunnelSimple size={32} weight="duotone" />}
            title="No runs match these filters"
            hint="Try widening the suite, environment or date range."
            action={
              <button className="btn" onClick={resetFilters}>
                Reset filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Trigger</th>
                <th>Suite</th>
                <th>Env</th>
                <th>Result</th>
                <th>Pass rate</th>
                <th>Duration</th>
                <th>When</th>
                <th>Triggered by</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const rate = pct(r.passed, r.total);
                const open = () => navigate(`/runs/${r.id}`);
                const onKeyDown = (e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open();
                  }
                };
                return (
                  <motion.tr
                    key={r.id}
                    className="clickable"
                    role="link"
                    tabIndex={0}
                    aria-label={`Open run ${r.id}`}
                    onClick={open}
                    onKeyDown={onKeyDown}
                    {...rowFadeUp(i, 0.03)}
                  >
                    <td>
                      <span className="run-id-cell">
                        <span className={`run-dot run-dot--${r.status}`} aria-hidden />
                        <span className="mono">{r.id}</span>
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-outline">
                        {r.trigger === "devin-session" && <Robot size={12} weight="duotone" />}
                        {r.trigger}
                      </span>
                    </td>
                    <td>{r.suite}</td>
                    <td>
                      <EnvBadge env={r.env} />
                    </td>
                    <td>
                      <span className="run-result">
                        <span className="run-pass num">{r.passed} passed</span>
                        <span className="run-result-sep">·</span>
                        <span className="run-fail num">{r.failed} failed</span>
                        {r.skipped > 0 && (
                          <>
                            <span className="run-result-sep">·</span>
                            <span className="run-skip num">{r.skipped} skipped</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="run-passrate">
                      <ProgressBar value={rate} showLabel thresholds={[90, 70]} />
                    </td>
                    <td className="num">{formatDuration(r.durationSec)}</td>
                    <td title={formatDate(r.startedAt)}>{timeAgo(r.startedAt)}</td>
                    <td>{userName(r.triggeredBy)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && hasFilters && (
        <p className="page-sub runs-reset-note">
          Filters applied client-side.{" "}
          <button className="mono runs-reset-btn" onClick={resetFilters}>
            Reset
          </button>
        </p>
      )}
    </div>
  );
}
