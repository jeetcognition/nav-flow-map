// Per-case results table for the RunDetail page, with expandable failure logs.
import { Fragment, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getNode, getTestCase } from "../../data/dataService";
import { EmptyState } from "../ui/EmptyState";
import { ResultBadge } from "../ui/badges";
import { rowFadeUp } from "../../lib/motion";
import { formatDuration } from "../../lib/format";
import type { CaseResult } from "../../types";

/** fake log excerpt derived from the case's expected text */
function logExcerpt(caseId: string): string {
  const tc = getTestCase(caseId);
  const raw = (tc?.expected ?? "the expected state to hold").trim().replace(/\.\s*$/, "");
  const clipped = raw.length > 110 ? `${raw.slice(0, 110)}…` : raw;
  const lowered = clipped.charAt(0).toLowerCase() + clipped.slice(1);
  return [
    `FAIL  ${caseId} › ${tc?.title ?? "unknown case"}`,
    `AssertionError: expected ${lowered}`,
    `    at assertState (qa-runner/executor.ts:214:11)`,
    `    at async runCase (qa-runner/executor.ts:88:5)`,
    ``,
    `Retried 1x — same failure. Exit code 1.`,
  ].join("\n");
}

export function RunResultsTable({ results }: { results: CaseResult[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const sorted = [...results].sort(
    (a, b) => (a.status === "failed" ? 0 : 1) - (b.status === "failed" ? 0 : 1),
  );

  const toggleExpand = (caseId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(caseId)) next.add(caseId);
      return next;
    });

  if (sorted.length === 0) {
    return (
      <div className="card">
        <EmptyState title="No per-case results recorded for this run" />
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Title</th>
            <th>Node</th>
            <th>Result</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((res, i) => {
            const tc = getTestCase(res.caseId);
            const node = getNode(res.nodeId);
            const failed = res.status === "failed";
            const isOpen = expanded.has(res.caseId);
            const onKeyDown = failed
              ? (e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(res.caseId);
                  }
                }
              : undefined;
            return (
              <Fragment key={res.caseId}>
                <motion.tr
                  className={failed ? "case-row--failed clickable" : ""}
                  role={failed ? "button" : undefined}
                  tabIndex={failed ? 0 : undefined}
                  aria-expanded={failed ? isOpen : undefined}
                  onClick={failed ? () => toggleExpand(res.caseId) : undefined}
                  onKeyDown={onKeyDown}
                  {...rowFadeUp(i, 0.03)}
                >
                  <td className="mono">{res.caseId}</td>
                  <td>
                    <span className="case-title" title={tc?.title}>
                      {tc?.title ?? "—"}
                    </span>
                  </td>
                  <td>
                    <Link to={`/navflow?node=${res.nodeId}`} onClick={(e) => e.stopPropagation()}>
                      {node?.label ?? res.nodeId}
                    </Link>
                  </td>
                  <td>
                    <span className="result-badges">
                      <ResultBadge status={res.status} />
                      {tc?.flaky && <span className="badge badge-amber">flaky</span>}
                    </span>
                  </td>
                  <td className="num">{formatDuration(res.durationSec)}</td>
                </motion.tr>
                {failed && isOpen && (
                  <tr>
                    <td className="case-expand-cell" colSpan={5}>
                      <pre className="log-block">{logExcerpt(res.caseId)}</pre>
                      <div className="shot-strip-label">Screenshots (placeholder)</div>
                      <div className="shot-strip">
                        {[1, 2, 3].map((n) => (
                          <div className="shot-box" key={n}>
                            Screenshot {n}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
