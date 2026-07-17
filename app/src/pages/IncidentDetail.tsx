import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bug,
  ClockCounterClockwise,
  Fire,
  Flask,
  LinkSimple,
  MapTrifold,
  Sparkle,
  UserCircle,
} from "@phosphor-icons/react";
import {
  getIncident,
  getNode,
  getUser,
  incidentCategory,
  overrideIncidentCategory,
} from "../data/dataService";
import { useDataVersion } from "../hooks/useData";
import { useApp } from "../hooks/useApp";
import { CategoryBadge, SeverityBadge } from "../components/ui/badges";
import { CATEGORIES, CATEGORY_META } from "../lib/categoryMeta";
import { EmptyState } from "../components/ui/EmptyState";
import { WidgetCard } from "../components/ui/WidgetCard";
import { CreateTestcaseModal } from "../components/incidents/CreateTestcaseModal";
import { formatDate } from "../lib/format";
import { fadeUp } from "../lib/motion";
import { SourceChip } from "../components/ui/SourceChip";
import { ConfidenceMeter } from "../components/ui/ConfidenceMeter";
import type { Incident } from "../types";
import "../styles/incidents.css";

const STATUS_BADGE: Record<Incident["status"], [string, string]> = {
  open: ["Open", "badge-red"],
  investigating: ["Investigating", "badge-amber"],
  resolved: ["Resolved", "badge-green"],
};

export default function IncidentDetail() {
  useDataVersion();
  const { incidentId } = useParams<{ incidentId: string }>();
  const { user } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const incident = incidentId ? getIncident(incidentId) : undefined;

  if (!incident) {
    return (
      <div className="page">
        <Link to="/incidents" className="back-link">
          <ArrowLeft size={14} weight="bold" /> Incidents
        </Link>
        <EmptyState
          icon={<Fire size={28} weight="duotone" />}
          title="Incident not found"
          hint={`No incident with id "${incidentId ?? ""}" exists in the feed.`}
          action={
            <Link to="/incidents" className="btn">
              Back to incidents
            </Link>
          }
        />
      </div>
    );
  }

  const effective = incidentCategory(incident);
  const node = getNode(incident.nodeId);
  const overriddenBy = incident.overriddenBy ? getUser(incident.overriddenBy) : undefined;
  const [statusLabel, statusCls] = STATUS_BADGE[incident.status];
  const isAppBug = effective === "app-bug";

  const timeline: { text: React.ReactNode; time?: string }[] = [
    {
      text: (
        <>
          Created via <strong>{incident.source === "pylon" ? "Pylon" : "Datadog"}</strong>
        </>
      ),
      time: formatDate(incident.createdAt),
    },
    {
      text: (
        <>
          AI categorized as <strong>{CATEGORY_META[incident.ai.category].label}</strong> (
          {Math.round(incident.ai.confidence * 100)}% confidence)
        </>
      ),
    },
  ];
  if (incident.humanCategory) {
    timeline.push({
      text: (
        <>
          Recategorized as <strong>{CATEGORY_META[incident.humanCategory].label}</strong> by{" "}
          {overriddenBy?.name ?? incident.overriddenBy}
        </>
      ),
    });
  }
  if (incident.linkedCaseId) {
    timeline.push({
      text: (
        <>
          Testcase <span className="mono">{incident.linkedCaseId}</span> created
        </>
      ),
    });
  }
  if (incident.status === "resolved") {
    timeline.push({ text: <strong>Resolved</strong> });
  }

  return (
    <div className="page">
      <Link to="/incidents" className="back-link">
        <ArrowLeft size={14} weight="bold" /> Incidents
      </Link>

      <motion.div className="inc-detail-head" {...fadeUp()}>
        <div>
          <div className="inc-detail-id">{incident.id}</div>
          <h1 className="page-title">{incident.title}</h1>
          <div className="inc-detail-badges">
            <SeverityBadge severity={incident.severity} />
            <span className={`badge ${statusCls}`}>{statusLabel}</span>
            <SourceChip source={incident.source} />
          </div>
        </div>
        <button
          className={`btn ${isAppBug ? "btn-ai-strong" : "btn-ai"}`}
          onClick={() => setModalOpen(true)}
        >
          <Sparkle size={15} weight="duotone" />
          Create testcase from this incident
        </button>
      </motion.div>

      <div className="inc-detail-grid">
        <div className="inc-detail-col">
          <WidgetCard title="Description" icon={<Fire size={14} weight="duotone" />} index={0}>
            <p className="inc-desc-text">{incident.description}</p>
          </WidgetCard>

          <WidgetCard
            title="AI triage"
            icon={<Sparkle size={14} weight="duotone" color="var(--ai)" />}
            index={1}
            className="ai-triage-card"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-3)",
                flexWrap: "wrap",
              }}
            >
              <CategoryBadge category={effective} />
              <ConfidenceMeter value={incident.ai.confidence} />
            </div>
            <p className="ai-rationale">{incident.ai.rationale}</p>
            <div className="override-btns">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`btn btn-mini ${c === effective ? "current" : ""}`}
                  onClick={() => overrideIncidentCategory(incident.id, c, user.id)}
                >
                  {CATEGORY_META[c].label}
                </button>
              ))}
            </div>
            <div className="override-note">
              Overrides are logged as training signal.
              {overriddenBy && <> Last overridden by {overriddenBy.name}.</>}
            </div>
          </WidgetCard>

          <WidgetCard
            title="Timeline"
            icon={<ClockCounterClockwise size={14} weight="duotone" />}
            index={2}
          >
            <div className="timeline">
              {timeline.map((item, idx) => (
                <div className="tl-item" key={idx}>
                  <span className="tl-dot" />
                  <div className="tl-text">{item.text}</div>
                  {item.time && <div className="tl-time">{item.time}</div>}
                </div>
              ))}
            </div>
          </WidgetCard>
        </div>

        <div className="inc-detail-col">
          <WidgetCard title="Customer" icon={<UserCircle size={14} weight="duotone" />} index={1}>
            <div className="mono" style={{ fontSize: "var(--fs-sm)" }}>
              {incident.customer}
            </div>
            <div className="inc-masked-note">Customer info is masked in Phase 1.</div>
          </WidgetCard>

          <WidgetCard
            title="Traceability"
            icon={<LinkSimple size={14} weight="duotone" />}
            index={2}
          >
            <div className="trace-list">
              <div className="trace-row">
                <span className="trace-label">
                  <Bug size={13} weight="duotone" /> Linked bug
                </span>
                {incident.linkedBugId ? (
                  <Link to={`/bugs/${incident.linkedBugId}`} className="mono">
                    {incident.linkedBugId}
                  </Link>
                ) : (
                  <span className="trace-missing">—</span>
                )}
              </div>
              <div className="trace-row">
                <span className="trace-label">
                  <Flask size={13} weight="duotone" /> Testcase
                </span>
                {incident.linkedCaseId ? (
                  <Link to={`/automation?case=${incident.linkedCaseId}`} className="mono">
                    {incident.linkedCaseId}
                  </Link>
                ) : (
                  <span className="trace-missing">—</span>
                )}
              </div>
              <div className="trace-row">
                <span className="trace-label">
                  <MapTrifold size={13} weight="duotone" /> Node
                </span>
                {node ? (
                  <Link to={`/map?node=${node.id}`}>{node.label}</Link>
                ) : (
                  <span className="trace-missing">—</span>
                )}
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>

      <CreateTestcaseModal
        incident={modalOpen ? incident : null}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
