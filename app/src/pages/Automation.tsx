import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "@phosphor-icons/react";
import {
  getNodes,
  getSessions,
  getTestCases,
  nodeStats,
  triggerDevinSession,
} from "../data/dataService";
import { useDataVersion } from "../hooks/useData";
import { rowFadeUp } from "../lib/motion";
import { StatStrip } from "../components/ui/StatStrip";
import { SessionsPanel } from "../components/automation/SessionsPanel";
import { CoverageTable, type CovRow } from "../components/automation/CoverageTable";
import { CaseExplorer } from "../components/automation/CaseExplorer";
import { CandidatesCard, CoverageGapCard } from "../components/automation/AiInsights";
import { pct } from "../lib/format";
import "../styles/automation.css";

export default function Automation() {
  const version = useDataVersion();
  const [params] = useSearchParams();
  const caseParam = params.get("case") ?? "";

  const cases = getTestCases();
  const sessions = getSessions();

  const { counts, covRows, nodesWithCases, nodeLabel } = useMemo(() => {
    const all = getTestCases();
    const caseCounts = {
      total: all.length,
      automated: all.filter((c) => c.automation === "automated").length,
      inProgress: all.filter((c) => c.automation === "in-progress").length,
      notAutomatable: all.filter((c) => c.automation === "not-automatable").length,
    };
    const labelByNode = new Map<string, string>();
    const coverageRows: CovRow[] = [];
    for (const node of getNodes()) {
      labelByNode.set(node.id, node.label);
      const stats = nodeStats(node.id);
      if (stats.total > 0)
        coverageRows.push({ node, stats, autoPct: pct(stats.automated, stats.total) });
    }
    coverageRows.sort((a, b) => a.autoPct - b.autoPct || b.stats.total - a.stats.total);
    const sortedNodes = coverageRows
      .map((r) => r.node)
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label));
    return {
      counts: caseCounts,
      covRows: coverageRows,
      nodesWithCases: sortedNodes,
      nodeLabel: labelByNode,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const passing = covRows.reduce((s, r) => s + r.stats.passing, 0);
  const failing = covRows.reduce((s, r) => s + r.stats.failing, 0);
  const passingPct = pct(passing, passing + failing);

  const hasLive = sessions.some((s) => s.status === "queued" || s.status === "running");

  return (
    <div className="page">
      <motion.div className="page-head" {...rowFadeUp(0, 0.07)}>
        <div>
          <h1 className="page-title">Automation</h1>
          <p className="page-sub">
            Start with the least-automated nodes below — or ask the AI where coverage is riskiest.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => triggerDevinSession("Full Enterprise suite", "enterprise")}
        >
          <Play size={15} weight="duotone" /> Run full suite
        </button>
      </motion.div>

      <motion.div className="auto-section" {...rowFadeUp(1, 0.07)}>
        <StatStrip
          stats={[
            { label: "Total cases", value: counts.total },
            {
              label: "Automated",
              value: `${counts.automated} · ${pct(counts.automated, counts.total)}%`,
              tone: "green",
            },
            { label: "In progress", value: counts.inProgress, tone: "amber" },
            { label: "Not automatable", value: counts.notAutomatable },
            {
              label: "Passing",
              value: `${passingPct}%`,
              tone: passingPct >= 90 ? "green" : passingPct >= 75 ? "amber" : "red",
            },
          ]}
        />
      </motion.div>

      {hasLive && <SessionsPanel sessions={sessions} index={2} />}

      <CoverageTable rows={covRows} index={hasLive ? 3 : 2} />

      <motion.section className="ai-grid auto-section" {...rowFadeUp(hasLive ? 4 : 3, 0.07)}>
        <CoverageGapCard />
        <CandidatesCard />
      </motion.section>

      {!hasLive && <SessionsPanel sessions={sessions} index={4} />}

      <CaseExplorer
        cases={cases}
        nodes={nodesWithCases}
        nodeLabel={nodeLabel}
        caseParam={caseParam}
        index={5}
      />
    </div>
  );
}
