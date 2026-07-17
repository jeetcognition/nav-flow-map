import { useState } from "react";
import { motion } from "framer-motion";
import { Fire } from "@phosphor-icons/react";
import { escapedDefects, getIncidents, incidentCategory } from "../data/dataService";
import { useDataVersion } from "../hooks/useData";
import { CATEGORIES, CATEGORY_META } from "../lib/categoryMeta";
import { SEVERITIES } from "../lib/severity";
import { fadeUp } from "../lib/motion";
import { SourceChip } from "../components/ui/SourceChip";
import { EmptyState } from "../components/ui/EmptyState";
import { CreateTestcaseModal } from "../components/incidents/CreateTestcaseModal";
import { IncidentCard } from "../components/incidents/IncidentCard";
import { IncidentBreakdown } from "../components/incidents/IncidentBreakdown";
import { pct } from "../lib/format";
import type { Incident } from "../types";
import "../styles/incidents.css";

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
      <IncidentBreakdown incidents={incidents} />

      <CreateTestcaseModal incident={modalIncident} onClose={() => setModalIncident(null)} />
    </div>
  );
}
