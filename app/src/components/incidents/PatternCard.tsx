// One coverage-gap pattern: collapsed single line, expandable to a story rail
// (what breaks → what to test → evidence, user-picked design 2026-08-07).
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CaretDown,
  CheckCircle,
  Fire,
  Prohibit,
  Sparkle,
  Ticket,
  TrendUp,
} from "@phosphor-icons/react";
import { getSurfaces, patternIncidents, setPatternCoverage } from "../../data/dataService";
import { useApp } from "../../hooks/useApp";
import { rowFadeUp } from "../../lib/motion";
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
          <div className="pat-chap">
            <div className="pat-chap-ico ico-breaks">
              <Fire size={15} weight="duotone" />
            </div>
            <div className="pat-chap-main">
              <div className="pat-chap-h">What breaks · {pattern.flow}</div>
              <p className="pat-desc">{top?.description || pattern.label}</p>
              <p className="pat-reason">{pattern.priorityReason}</p>
            </div>
          </div>

          <div className="pat-chap">
            <div className="pat-chap-ico ico-test">
              <Sparkle size={15} weight="duotone" />
            </div>
            <div className="pat-chap-main">
              <div className="pat-chap-h">
                What to test
                <span className="pat-id mono">{pattern.id.replace(/^PAT-/, "")}</span>
              </div>
              <ol className="pat-steps">
                {pattern.suggestedTest
                  .replace(/^Reproduce: /, "")
                  .split("→")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((step, i) => (
                    <li key={i} className="pat-step">
                      <span className="pat-step-no num">{i + 1}</span>
                      {step}
                    </li>
                  ))}
              </ol>
              {pattern.coveredBy && (
                <p className="pat-covered-by">
                  covered by <span className="mono">{pattern.coveredBy}</span>
                </p>
              )}
              <div className="pat-actions">
                {top && (
                  <button
                    className="btn btn-mini btn-ai-strong"
                    onClick={() => onCreateTestcase(top)}
                  >
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
            </div>
          </div>

          <div className="pat-chap">
            <div className="pat-chap-ico ico-evid">
              <Ticket size={15} weight="duotone" />
            </div>
            <div className="pat-chap-main">
              <details className="pat-tickets">
                <summary>Show evidence</summary>
                <div className="pat-evidence">
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
                        className="pat-ev-row"
                        href={ev.link}
                        target="_blank"
                        rel="noreferrer"
                        title={ev.title ? `#${ev.number} — ${ev.title}` : `#${ev.number}`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <span key={ev.number} className="pat-ev-row">
                        {inner}
                      </span>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}
