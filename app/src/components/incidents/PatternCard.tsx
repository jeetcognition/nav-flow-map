// One coverage-gap pattern: collapsed single line, expandable to the full
// what-breaks / what-to-test / evidence / actions body (QA-DEC-027 UI).
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CaretDown, CheckCircle, Prohibit, Sparkle, TrendUp } from "@phosphor-icons/react";
import { getSurfaces, patternIncidents, setPatternCoverage } from "../../data/dataService";
import { useApp } from "../../hooks/useApp";
import { rowFadeUp } from "../../lib/motion";
import { IncidentCard } from "./IncidentCard";
import type { Incident, Pattern } from "../../types";

const SURFACE_COLORS: Record<string, string> = {
  enterprise: "#4a9ef5",
  retail: "#9b6dff",
  windsurf: "#2ecda7",
  "devin-cli": "#f5a623",
};

function CoverForm({ pattern, onDone }: { pattern: Pattern; onDone: () => void }) {
  const { user } = useApp();
  const [testId, setTestId] = useState(pattern.coveredBy ?? "");
  return (
    <form
      className="pat-cover-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!testId.trim()) return;
        setPatternCoverage(pattern.id, "covered", testId.trim(), user.id);
        onDone();
      }}
    >
      <input
        autoFocus
        value={testId}
        onChange={(e) => setTestId(e.target.value)}
        placeholder="Covering test id, e.g. ENT-REG12"
        aria-label="Covering test id"
      />
      <button type="submit" className="btn btn-mini btn-ai-strong" disabled={!testId.trim()}>
        Save
      </button>
      <button type="button" className="btn btn-mini" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}

export function PatternCard({
  pattern,
  index,
  onCreateTestcase,
}: {
  pattern: Pattern;
  index: number;
  onCreateTestcase: (i: Incident) => void;
}) {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [covering, setCovering] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const members = patternIncidents(pattern);
  const top = members[0];
  const surfaceLabel =
    getSurfaces().find((s) => s.id === pattern.surfaceId)?.label ?? pattern.surfaceId;
  const color = SURFACE_COLORS[pattern.surfaceId] ?? "var(--text-3)";
  const freq =
    pattern.count14d > 0
      ? `${pattern.count14d} in 14d`
      : `${pattern.total} ticket${pattern.total === 1 ? "" : "s"}`;

  return (
    <motion.article
      className={`card pat-card ${open ? "open" : ""}`}
      style={{ borderLeftColor: color }}
      {...rowFadeUp(index, 0.03)}
    >
      <button
        className="pat-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Pattern: ${pattern.label}`}
      >
        <span className="pat-rank num">{index + 1}</span>
        <span className="pat-label">{pattern.label}</span>
        <span className="pat-meta">
          {pattern.trend === "accelerating" && (
            <span className="badge badge-red">
              <TrendUp size={11} weight="bold" /> accelerating
            </span>
          )}
          {pattern.trend === "new" && <span className="badge badge-amber">new</span>}
          {pattern.trend === "declining" && <span className="badge badge-green">declining</span>}
          {pattern.coverage === "covered" && <span className="badge badge-green">covered</span>}
          {pattern.coverage === "weak" && <span className="badge badge-amber">weak</span>}
          {pattern.coverage === "dismissed" && <span className="badge badge-gray">dismissed</span>}
          <span className="pat-surface" style={{ color }}>
            {surfaceLabel}
          </span>
          <span className="pat-count num">
            {freq}
            {pattern.open > 0 && ` · ${pattern.open} open`}
          </span>
        </span>
        <CaretDown size={14} weight="bold" className="pat-carrot" />
      </button>

      {open && (
        <div className="pat-body">
          <div className="pat-grid">
            <section>
              <h4 className="pat-sec-title">What breaks</h4>
              <p className="pat-desc">
                {pattern.flow} — {top?.description || pattern.label}
              </p>
              <p className="pat-reason">{pattern.priorityReason}</p>
              <div className="pat-evidence">
                <span className="pat-evidence-label">Evidence</span>
                {pattern.evidence.slice(0, 5).map((ev) => {
                  const inner = (
                    <>
                      <span className="pat-ticket-num">#{ev.number}</span>
                      {ev.title && <span className="pat-ticket-title">{ev.title}</span>}
                    </>
                  );
                  return ev.link ? (
                    <a
                      key={ev.number}
                      className="pat-ticket-line"
                      href={ev.link}
                      target="_blank"
                      rel="noreferrer"
                      title={ev.title ? `#${ev.number} — ${ev.title}` : `#${ev.number}`}
                    >
                      {inner}
                    </a>
                  ) : (
                    <span key={ev.number} className="pat-ticket-line">
                      {inner}
                    </span>
                  );
                })}
              </div>
            </section>
            <section>
              <h4 className="pat-sec-title">
                <Sparkle size={12} weight="duotone" /> What to test
                <span className="pat-id mono">{pattern.id.replace(/^PAT-/, "")}</span>
              </h4>
              <p className="pat-test">{pattern.suggestedTest}</p>
              {pattern.coveredBy && (
                <p className="pat-covered-by">
                  covered by <span className="mono">{pattern.coveredBy}</span>
                </p>
              )}
            </section>
          </div>

          <div className="pat-actions">
            {top && (
              <button className="btn btn-mini btn-ai-strong" onClick={() => onCreateTestcase(top)}>
                <Sparkle size={13} weight="duotone" /> Draft testcase
              </button>
            )}
            {covering ? (
              <CoverForm pattern={pattern} onDone={() => setCovering(false)} />
            ) : (
              <button className="btn btn-mini" onClick={() => setCovering(true)}>
                <CheckCircle size={13} weight="duotone" /> Mark covered…
              </button>
            )}
            {pattern.coverage !== "dismissed" &&
              (confirmDismiss ? (
                <span className="pat-confirm">
                  <button
                    className="btn btn-mini btn-danger"
                    onClick={() => {
                      setPatternCoverage(pattern.id, "dismissed", null, user.id);
                      setConfirmDismiss(false);
                    }}
                  >
                    Confirm dismiss
                  </button>
                  <button className="btn btn-mini" onClick={() => setConfirmDismiss(false)}>
                    Keep
                  </button>
                </span>
              ) : (
                <button className="btn btn-mini" onClick={() => setConfirmDismiss(true)}>
                  <Prohibit size={13} weight="duotone" /> Dismiss as noise
                </button>
              ))}
            <Link className="link-chip" to={`/navflow?node=${pattern.nodeId}`}>
              Open in Flow Map
            </Link>
          </div>

          {members.length > 0 && (
            <details className="pat-tickets">
              <summary>Individual tickets ({members.length})</summary>
              <div className="pat-ticket-list">
                {members.map((inc, i) => (
                  <IncidentCard
                    key={inc.id}
                    incident={inc}
                    index={i}
                    onCreateTestcase={onCreateTestcase}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </motion.article>
  );
}
