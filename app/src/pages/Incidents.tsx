import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowsClockwise, Bug, CaretDown, CheckCircle, Fire, Sparkle } from "@phosphor-icons/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  escapedDefects,
  getIncidents,
  getNode,
  getUser,
  incidentCategory,
  overrideIncidentCategory,
} from "../data/dataService";
import { useDataVersion } from "../hooks/useData";
import { useApp } from "../hooks/useApp";
import { useClickOutside } from "../hooks/useClickOutside";
import { CategoryBadge, SeverityBadge } from "../components/ui/badges";
import { CATEGORIES, CATEGORY_META } from "../lib/categoryMeta";
import { SEVERITIES, SEVERITY_COLOR } from "../lib/severity";
import { fadeUp, rowFadeUp } from "../lib/motion";
import { CategoryDonut, TrendAreaChart } from "../components/ui/charts";
import { AXIS_TICK, CHART_TOOLTIP } from "../lib/chartTheme";
import { WidgetCard } from "../components/ui/WidgetCard";
import { SourceChip } from "../components/ui/SourceChip";
import { ConfidenceMeter } from "../components/ui/ConfidenceMeter";
import { Disclosure } from "../components/ui/Disclosure";
import { EmptyState } from "../components/ui/EmptyState";
import { CreateTestcaseModal } from "../components/incidents/CreateTestcaseModal";
import { timeAgo, pct } from "../lib/format";
import type { Incident } from "../types";
import "../styles/incidents.css";

/* ---- small pieces ---- */

function OverrideDropdown({ incident }: { incident: Incident }) {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const current = incidentCategory(incident);

  return (
    <div className="override-wrap" ref={ref}>
      <button
        className="btn btn-mini"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Override <CaretDown size={12} weight="bold" />
      </button>
      {open && (
        <div className="override-menu" role="menu">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="menuitem"
              className={c === current ? "current" : ""}
              onClick={() => {
                overrideIncidentCategory(incident.id, c, user.id);
                setOpen(false);
              }}
            >
              <span className="dot" style={{ background: CATEGORY_META[c].color }} />
              {CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- feed card ---- */

function IncidentCard({
  incident,
  index,
  onCreateTestcase,
}: {
  incident: Incident;
  index: number;
  onCreateTestcase: (i: Incident) => void;
}) {
  const navigate = useNavigate();
  const node = getNode(incident.nodeId);
  const effective = incidentCategory(incident);
  const overriddenBy = incident.overriddenBy ? getUser(incident.overriddenBy) : undefined;
  const isAppBug = effective === "app-bug";

  return (
    <motion.article className="card inc-card" {...rowFadeUp(index, 0.045)}>
      <div
        className="inc-card-top"
        onClick={() => navigate(`/incidents/${incident.id}`)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/incidents/${incident.id}`)}
      >
        <SeverityBadge severity={incident.severity} />
        <span className="inc-card-title">{incident.title}</span>
        <SourceChip source={incident.source} />
        <span className="inc-card-meta" onClick={(e) => e.stopPropagation()}>
          <span className="inc-customer mono">{incident.customer}</span>
          <span className="inc-ago">{timeAgo(incident.createdAt)}</span>
          {node && (
            <Link className="node-chip" to={`/map?node=${node.id}`} title={node.route}>
              {node.label}
            </Link>
          )}
        </span>
      </div>

      <div className="inc-triage">
        <span className="inc-triage-label">
          <Sparkle size={12} weight="duotone" /> AI triage
        </span>
        <CategoryBadge category={effective} />
        <ConfidenceMeter value={incident.ai.confidence} />
        {incident.humanCategory && (
          <span className="inc-overridden">
            <ArrowsClockwise size={12} weight="duotone" />
            overridden by {overriddenBy?.name ?? incident.overriddenBy}
            <span className={`badge ${CATEGORY_META[incident.ai.category].cls} ai-orig-badge`}>
              {CATEGORY_META[incident.ai.category].label}
            </span>
          </span>
        )}
      </div>

      <div className="inc-actions">
        <button
          className={`btn btn-mini ${isAppBug ? "btn-ai-strong" : "btn-ai"}`}
          onClick={() => onCreateTestcase(incident)}
        >
          <Sparkle size={13} weight="duotone" />
          Create testcase
        </button>
        <OverrideDropdown incident={incident} />
        {incident.linkedCaseId && (
          <Link
            className="link-chip link-chip-green"
            to={`/automation?case=${incident.linkedCaseId}`}
          >
            <CheckCircle size={13} weight="duotone" />
            testcase linked <span className="mono">{incident.linkedCaseId}</span>
          </Link>
        )}
        {incident.linkedBugId && (
          <Link className="link-chip link-chip-red" to={`/bugs/${incident.linkedBugId}`}>
            <Bug size={13} weight="duotone" />
            <span className="mono">{incident.linkedBugId}</span>
          </Link>
        )}
      </div>
    </motion.article>
  );
}

/* ---- page ---- */

export default function Incidents() {
  useDataVersion();
  const [catFilter, setCatFilter] = useState<string>("all");
  const [srcFilter, setSrcFilter] = useState<string>("all");
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalIncident, setModalIncident] = useState<Incident | null>(null);

  const incidents = getIncidents();
  const pylonCount = incidents.filter((i) => i.source === "pylon").length;
  const datadogCount = incidents.length - pylonCount;

  // widget data (always over the full feed, not the filtered view)
  const bySeverity = SEVERITIES.map((s) => ({
    sev: s,
    count: incidents.filter((i) => i.severity === s).length,
  }));

  const nodeCounts = new Map<string, number>();
  for (const i of incidents) nodeCounts.set(i.nodeId, (nodeCounts.get(i.nodeId) ?? 0) + 1);
  const topNodes = [...nodeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxNodeCount = topNodes[0]?.[1] ?? 1;

  const escaped = escapedDefects();
  const appBugs = incidents.filter((i) => incidentCategory(i) === "app-bug");
  const converted = appBugs.filter((i) => i.linkedCaseId).length;
  const conversionPct = pct(converted, appBugs.length);

  const filtered = incidents
    .filter((i) => catFilter === "all" || incidentCategory(i) === catFilter)
    .filter((i) => srcFilter === "all" || i.source === srcFilter)
    .filter((i) => sevFilter === "all" || i.severity === sevFilter)
    .filter((i) => statusFilter === "all" || i.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Incidents</h1>
          <p className="page-sub">
            Review the AI&apos;s triage, fix wrong calls, and turn real bugs into regression tests.
            <span className="inc-sub-chips">
              <SourceChip source="pylon" count={pylonCount} />
              <SourceChip source="datadog" count={datadogCount} />
            </span>
          </p>
        </div>
      </div>

      {/* escaped defect strip */}
      <motion.div className="card inc-escaped" {...fadeUp(0.06)}>
        <div className="inc-escaped-main">
          <Fire size={24} weight="duotone" color="var(--danger)" />
          <div>
            <div className="inc-escaped-count">
              {escaped.length} escaped defect{escaped.length === 1 ? "" : "s"}
            </div>
            <div className="inc-escaped-desc">app-bug incidents with no linked testcase</div>
          </div>
        </div>
        <div className="inc-escaped-conv">
          <div className="inc-escaped-conv-label">
            {converted} of {appBugs.length} app-bug incidents converted to regression tests ·{" "}
            <span className="num">{conversionPct}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${conversionPct}%`, background: "var(--ai)" }}
            />
          </div>
        </div>
      </motion.div>

      {/* filter bar */}
      <div className="inc-filters">
        <label className="inc-filter">
          Category
          <select
            aria-label="Filter by category"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="all">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </label>
        <label className="inc-filter">
          Source
          <select
            aria-label="Filter by source"
            value={srcFilter}
            onChange={(e) => setSrcFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pylon">Pylon</option>
            <option value="datadog">Datadog</option>
          </select>
        </label>
        <label className="inc-filter">
          Severity
          <select
            aria-label="Filter by severity"
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value)}
          >
            <option value="all">All</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="inc-filter">
          Status
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
        <span className="inc-filter-count num">
          {filtered.length} of {incidents.length} incidents
        </span>
      </div>

      {/* feed */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Fire size={28} weight="duotone" />}
          title="No incidents match these filters"
          hint="Try widening the category, source, severity, or status filters."
        />
      ) : (
        <div className="inc-feed" key={`${catFilter}-${srcFilter}-${sevFilter}-${statusFilter}`}>
          {filtered.map((incident, idx) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              index={idx}
              onCreateTestcase={setModalIncident}
            />
          ))}
        </div>
      )}

      {/* secondary charts — collapsed so the feed stays the focus */}
      <div className="inc-breakdown">
        <Disclosure label="Breakdown & trends">
          <div className="inc-widgets">
            <WidgetCard title="By category" index={0} className="inc-widget">
              <CategoryDonut incidents={incidents} />
            </WidgetCard>

            <WidgetCard title="By severity" index={1} className="inc-widget">
              <div style={{ height: 172 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bySeverity} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid stroke="var(--grid-line)" vertical={false} />
                    <XAxis dataKey="sev" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP}
                      itemStyle={{ color: "var(--text)" }}
                      cursor={{ fill: "rgba(148,163,184,0.06)" }}
                    />
                    <Bar dataKey="count" name="incidents" radius={[4, 4, 0, 0]} maxBarSize={34}>
                      {bySeverity.map((d) => (
                        <Cell key={d.sev} fill={SEVERITY_COLOR[d.sev]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WidgetCard>

            <WidgetCard title="Trend" index={2} className="inc-widget">
              <TrendAreaChart incidents={incidents} />
            </WidgetCard>

            <WidgetCard title="Top affected nodes" index={3} className="inc-widget">
              {topNodes.length === 0 ? (
                <EmptyState title="No incidents" />
              ) : (
                <div className="top-nodes">
                  {topNodes.map(([nodeId, count]) => (
                    <Link key={nodeId} className="top-node-row" to={`/map?node=${nodeId}`}>
                      <span className="top-node-label">{getNode(nodeId)?.label ?? nodeId}</span>
                      <span className="top-node-bar">
                        <span style={{ width: `${(count / maxNodeCount) * 100}%` }} />
                      </span>
                      <span className="top-node-count num">{count}</span>
                    </Link>
                  ))}
                </div>
              )}
            </WidgetCard>
          </div>
        </Disclosure>
      </div>

      <CreateTestcaseModal incident={modalIncident} onClose={() => setModalIncident(null)} />
    </div>
  );
}
