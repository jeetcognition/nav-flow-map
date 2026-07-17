import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChartDonut, Robot, X } from "@phosphor-icons/react";
import { useApp } from "../hooks/useApp";
import { useDataVersion } from "../hooks/useData";
import {
  getBugs,
  getIncidents,
  getNodes,
  getRuns,
  getSessions,
  nodeStats,
  surfaceStats,
} from "../data/dataService";
import type { NavNode } from "../types";
import { AttentionQueue } from "../components/ui/AttentionQueue";
import { StatStrip, type StripStat } from "../components/ui/StatStrip";
import { Disclosure } from "../components/ui/Disclosure";
import { SessionBadge } from "../components/ui/badges";
import { EmptyState } from "../components/ui/EmptyState";
import { WidgetCard } from "../components/ui/WidgetCard";
import { CategoryDonut, TrendAreaChart } from "../components/ui/charts";
import { SEVERITIES, SEVERITY_COLOR } from "../lib/severity";
import { fadeUp, rowFadeUp } from "../lib/motion";
import { pct, timeAgo } from "../lib/format";
import "../styles/dashboard.css";

const GROUPS: { id: NavNode["group"]; label: string }[] = [
  { id: "entry", label: "Entry" },
  { id: "suborg", label: "Sub-org" },
  { id: "personal", label: "Personal" },
  { id: "enterprise", label: "Enterprise" },
];

export default function Dashboard() {
  const { surface } = useApp();
  const version = useDataVersion();

  const d = useMemo(() => {
    void version;
    const ss = surfaceStats(surface.id);
    const openBugs = getBugs().filter((b) => b.status !== "closed" && b.status !== "verified");
    const incidents = getIncidents();
    const openIncidents = incidents.filter((i) => i.status !== "resolved").length;

    const groups = GROUPS.map((g) => {
      const nodes = getNodes().filter((n) => n.group === g.id);
      const stats = nodes.map((n) => nodeStats(n.id));
      const covered = stats.filter((s) => s.coverage === "covered").length;
      const cases = stats.reduce((acc, s) => acc + s.total, 0);
      return {
        ...g,
        nodeCount: nodes.length,
        covered,
        coveredPct: pct(covered, nodes.length),
        cases,
      };
    });

    const runs = [...getRuns()].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 5);

    const severities = SEVERITIES.map((sev) => ({
      sev,
      count: openBugs.filter((b) => b.severity === sev).length,
    }));
    const maxSev = Math.max(1, ...severities.map((s) => s.count));

    const sessions = getSessions().slice(0, 4);

    return {
      ss,
      openBugs: openBugs.length,
      openIncidents,
      incidents,
      groups,
      runs,
      severities,
      maxSev,
      sessions,
    };
  }, [version, surface.id]);

  const stats: StripStat[] = [
    { label: "coverage", value: `${d.ss.coveredPct}%` },
    { label: "automated", value: `${d.ss.automatedPct}%` },
    {
      label: "open bugs",
      value: d.openBugs,
      tone: d.openBugs > 0 ? "red" : "default",
      to: "/bugs",
    },
    {
      label: "open incidents",
      value: d.openIncidents,
      tone: d.openIncidents > 0 ? "amber" : "default",
      to: "/incidents",
    },
  ];

  return (
    <div className="page dash">
      <motion.div className="page-head" {...fadeUp()}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            Start with what needs attention — everything else is one click deeper.
          </p>
        </div>
      </motion.div>

      {/* 1 — The hero: what needs me now */}
      <motion.div className="dash-attention" {...fadeUp(0.06)}>
        <AttentionQueue />
      </motion.div>

      {/* 2 — Four numbers, one line */}
      <motion.div className="dash-strip" {...fadeUp(0.14)}>
        <StatStrip stats={stats} />
      </motion.div>

      {/* 3 — The two cards that point at work */}
      <div className="dash-grid dash-main">
        <WidgetCard title="Recent runs" linkTo="/runs" index={0} className="dash-widget">
          {d.runs.length === 0 ? (
            <EmptyState title="No runs yet" hint="Trigger a suite to see results here" />
          ) : (
            <div className="dash-list">
              {d.runs.map((run, i) => (
                <motion.div key={run.id} {...rowFadeUp(i)}>
                  <Link to={`/runs/${run.id}`} className="dash-run-row">
                    <span className="num dash-run-id">{run.id}</span>
                    <span className="dash-run-suite">{run.suite}</span>
                    <span
                      className={`badge ${run.env === "staging" ? "badge-blue" : "badge-purple"}`}
                    >
                      {run.env}
                    </span>
                    <span className="dash-run-counts">
                      <span className="num dash-pass">
                        <Check size={12} weight="bold" />
                        {run.passed}
                      </span>
                      <span className="num dash-fail">
                        <X size={12} weight="bold" />
                        {run.failed}
                      </span>
                    </span>
                    <span className="dash-when">{timeAgo(run.startedAt)}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </WidgetCard>

        <WidgetCard title="Surface coverage" index={1} className="dash-widget">
          <div className="dash-cov-main">
            <div className="dash-cov-label">
              <span>{surface.label}</span>
              <span className="num dash-cov-pct">
                {d.ss.coveredPct}% covered · {d.ss.automatedPct}% automated
              </span>
            </div>
            <div className="progress-track dash-cov-track">
              <div className="progress-fill" style={{ width: `${d.ss.coveredPct}%` }} />
            </div>
          </div>
          <div className="dash-groups">
            {d.groups.map((g, i) => (
              <motion.div className="dash-group-row" key={g.id} {...rowFadeUp(i)}>
                <span className="dash-group-label">{g.label}</span>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${g.coveredPct}%`,
                      background:
                        g.coveredPct >= 60
                          ? "var(--accent)"
                          : g.coveredPct > 0
                            ? "var(--warning)"
                            : "var(--surface-3)",
                    }}
                  />
                </div>
                <span className="num dash-group-num">
                  {g.covered}/{g.nodeCount}
                </span>
                <span className="dash-group-cases">{g.cases} cases</span>
              </motion.div>
            ))}
          </div>
        </WidgetCard>
      </div>

      {/* 4 — Everything else, one click deeper */}
      <div className="dash-more">
        <Disclosure label="Breakdown & trends">
          <div className="dash-grid">
            <WidgetCard title="Incidents by category" linkTo="/incidents" className="dash-widget">
              {d.incidents.length === 0 ? (
                <EmptyState
                  icon={<ChartDonut size={28} weight="duotone" />}
                  title="No incidents"
                  hint="Nothing has been reported"
                />
              ) : (
                <CategoryDonut incidents={d.incidents} />
              )}
            </WidgetCard>

            <WidgetCard title="Incident trend" linkTo="/incidents" className="dash-widget">
              <TrendAreaChart incidents={d.incidents} height={180} />
            </WidgetCard>

            <WidgetCard title="Open bugs by severity" linkTo="/bugs" className="dash-widget">
              <div className="dash-sev">
                {d.severities.map((row) => (
                  <div className="dash-sev-row" key={row.sev}>
                    <span className="num dash-sev-label">{row.sev}</span>
                    <div className="dash-sev-track">
                      <div
                        className="dash-sev-fill"
                        style={{
                          background: SEVERITY_COLOR[row.sev],
                          width: `${(row.count / d.maxSev) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="num dash-sev-count">{row.count}</span>
                  </div>
                ))}
              </div>
            </WidgetCard>

            <WidgetCard title="Active Devin sessions" linkTo="/automation" className="dash-widget">
              {d.sessions.length === 0 ? (
                <EmptyState
                  icon={<Robot size={28} weight="duotone" />}
                  title="No sessions"
                  hint="Kick off automation from a node or run"
                />
              ) : (
                <div className="dash-list">
                  {d.sessions.map((s) => (
                    <div className="dash-session-row" key={s.id}>
                      <span className="num dash-session-id">{s.id}</span>
                      <span className="dash-session-scope" title={s.scope}>
                        {s.scope}
                      </span>
                      <SessionBadge status={s.status} />
                      <span className="dash-when">{timeAgo(s.startedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </WidgetCard>
          </div>
        </Disclosure>
      </div>
    </div>
  );
}
