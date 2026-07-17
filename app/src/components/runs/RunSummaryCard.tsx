// AI run-summary card for the RunDetail page (loading / error / result states).
import { motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";
import { SkeletonLines } from "../ui/SkeletonLines";
import { fadeUp } from "../../lib/motion";
import type { RunSummary } from "../../data/aiService";

export function RunSummaryCard({
  summary,
  error,
}: {
  summary: RunSummary | null;
  error: string | null;
}) {
  return (
    <motion.div className="card ai-run-card" {...fadeUp(0.12)}>
      <div className="ai-run-card-head">
        <Sparkle size={16} weight="duotone" /> AI Run Summary
      </div>
      {error ? (
        <p className="ai-error" role="alert">
          {error}
        </p>
      ) : summary === null ? (
        <SkeletonLines lines={3} />
      ) : (
        <>
          <p className="ai-headline">{summary.headline}</p>
          {summary.clusters.map((cluster) => (
            <div className="ai-cluster" key={cluster.cause}>
              <span className="ai-cluster-cause">{cluster.cause}</span>
              <span className="ai-chip-row">
                {cluster.caseIds.map((id) => (
                  <span className="ai-chip" key={id}>
                    {id}
                  </span>
                ))}
              </span>
            </div>
          ))}
          {summary.flaky.length > 0 && (
            <div className="ai-flaky-row">
              <span className="badge badge-amber">flaky</span>
              <span>Known-flaky signatures:</span>
              <span className="ai-chip-row">
                {summary.flaky.map((id) => (
                  <span className="ai-chip" key={id}>
                    {id}
                  </span>
                ))}
              </span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
