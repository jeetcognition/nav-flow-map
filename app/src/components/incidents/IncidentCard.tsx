// Incident feed card (with inline AI-triage override) for the Incidents page.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowsClockwise, Bug, CaretDown, CheckCircle, Sparkle } from "@phosphor-icons/react";
import {
  getNode,
  getUser,
  incidentCategory,
  overrideIncidentCategory,
} from "../../data/dataService";
import { useApp } from "../../hooks/useApp";
import { useClickOutside } from "../../hooks/useClickOutside";
import { CategoryBadge, SeverityBadge } from "../ui/badges";
import { CATEGORIES, CATEGORY_META } from "../../lib/categoryMeta";
import { rowFadeUp } from "../../lib/motion";
import { SourceChip } from "../ui/SourceChip";
import { ConfidenceMeter } from "../ui/ConfidenceMeter";
import { timeAgo } from "../../lib/format";
import type { Incident } from "../../types";

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

export function IncidentCard({
  incident,
  index,
  onCreateTestcase,
}: {
  incident: Incident;
  index: number;
  onCreateTestcase: (i: Incident) => void;
}) {
  const { user } = useApp();
  const navigate = useNavigate();
  const node = getNode(incident.nodeId);
  const effective = incidentCategory(incident);
  const overriddenBy = incident.overriddenBy ? getUser(incident.overriddenBy) : undefined;
  const isAppBug = effective === "app-bug";
  const needsVerification = incident.verdict === "possible-bug" && !incident.humanCategory;
  const hasDraft = !!incident.draftCase && !incident.linkedCaseId;

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
        {needsVerification && <span className="badge badge-amber">Needs verification</span>}
        {incident.verdict === "definite-bug" && (
          <span className="badge badge-red">Definite bug</span>
        )}
        <span className="inc-card-meta" onClick={(e) => e.stopPropagation()}>
          <span className="inc-customer mono">{incident.customer}</span>
          <span className="inc-ago">{timeAgo(incident.createdAt)}</span>
          {node && (
            <Link className="node-chip" to={`/navflow?node=${node.id}`} title={node.route}>
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
        {needsVerification && (
          <button
            className="btn btn-mini btn-ai-strong"
            onClick={() => overrideIncidentCategory(incident.id, "app-bug", user.id)}
            title="Confirm this is an application bug"
          >
            <CheckCircle size={13} weight="duotone" />
            Confirm bug
          </button>
        )}
        <button
          className={`btn btn-mini ${isAppBug ? "btn-ai-strong" : "btn-ai"}`}
          onClick={() => onCreateTestcase(incident)}
        >
          <Sparkle size={13} weight="duotone" />
          {hasDraft ? "Review drafted testcase" : "Create testcase"}
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
