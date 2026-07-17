// AI-generated coverage-gap and automation-candidate cards for the Automation page.
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Play, Robot, Sparkle } from "@phosphor-icons/react";
import { triggerDevinSession } from "../../data/dataService";
import { automationCandidates, coverageGapReport } from "../../data/aiService";
import type { CoverageGap } from "../../data/aiService";
import { rowFadeUp } from "../../lib/motion";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonLines } from "../ui/SkeletonLines";
import { PriorityBadge } from "../ui/badges";
import type { TestCase } from "../../types";

function riskCls(risk: number): string {
  if (risk > 6) return "risk-high";
  if (risk >= 4) return "risk-med";
  return "risk-low";
}

export function CoverageGapCard() {
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<CoverageGap[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      setGaps(await coverageGapReport());
    } catch {
      setError("The coverage report failed to generate — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title ai">
            <Sparkle size={19} weight="duotone" /> Where is coverage lagging?
          </h2>
          <div className="auto-card-sub">
            Risk-ranked nodes from bugs, incidents, and automation gaps
          </div>
        </div>
        <button className="btn btn-ai" onClick={generate} disabled={loading}>
          <Sparkle size={15} weight="duotone" /> {gaps ? "Regenerate" : "Generate"}
        </button>
      </div>
      {error ? (
        <p className="ai-error" role="alert">
          {error}
        </p>
      ) : loading ? (
        <SkeletonLines lines={5} />
      ) : gaps === null ? (
        <EmptyState
          icon={<Sparkle size={26} weight="duotone" />}
          title="No report yet"
          hint="Generate to rank the riskiest under-covered flows."
        />
      ) : gaps.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={26} weight="duotone" />}
          title="No significant gaps found"
        />
      ) : (
        <div className="gap-list">
          {gaps.map((g, i) => (
            <motion.div key={g.nodeId} className="gap-item" {...rowFadeUp(i, 0.05)}>
              <span className="gap-rank">{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <Link className="cov-node-link gap-label" to={`/navflow?node=${g.nodeId}`}>
                  {g.label}
                </Link>
                <div className="gap-reason">{g.reason}</div>
              </div>
              <span className={`risk-chip ${riskCls(g.risk)}`}>{g.risk.toFixed(1)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CandidatesCard() {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<TestCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      setCandidates(await automationCandidates());
    } catch {
      setError("Candidate generation failed — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title ai">
            <Robot size={19} weight="duotone" /> Automation candidates
          </h2>
          <div className="auto-card-sub">Manual P1 cases worth automating next</div>
        </div>
        <button className="btn btn-ai" onClick={generate} disabled={loading}>
          <Sparkle size={15} weight="duotone" /> {candidates ? "Regenerate" : "Generate"}
        </button>
      </div>
      {error ? (
        <p className="ai-error" role="alert">
          {error}
        </p>
      ) : loading ? (
        <SkeletonLines lines={5} />
      ) : candidates === null ? (
        <EmptyState
          icon={<Robot size={26} weight="duotone" />}
          title="No suggestions yet"
          hint="Generate to surface the best automation targets."
        />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={26} weight="duotone" />}
          title="Nothing left to automate"
        />
      ) : (
        <>
          <div className="ai-hint">High-value, frequently run, stable flows</div>
          <div className="cand-list">
            {candidates.map((c, i) => (
              <motion.div key={c.id} className="cand-item" {...rowFadeUp(i, 0.05)}>
                <span className="cand-id">{c.id}</span>
                <span className="cand-title" title={c.title}>
                  {c.title}
                </span>
                <PriorityBadge priority={c.priority} />
                <button
                  className="run-btn"
                  title={`Run case ${c.id}`}
                  aria-label={`Run case ${c.id}`}
                  onClick={() => triggerDevinSession(`Case: ${c.id}`, "enterprise")}
                >
                  <Play size={14} weight="duotone" />
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
