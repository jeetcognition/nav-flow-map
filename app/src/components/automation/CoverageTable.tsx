// Coverage-by-node table for the Automation page.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, TrendUp } from "@phosphor-icons/react";
import { triggerDevinSession } from "../../data/dataService";
import { rowFadeUp } from "../../lib/motion";
import { ProgressBar } from "../ui/ProgressBar";
import type { NavNode, NodeStats } from "../../types";

export interface CovRow {
  node: NavNode;
  stats: NodeStats;
  autoPct: number;
}

export function CoverageTable({ rows, index }: { rows: CovRow[]; index: number }) {
  return (
    <motion.section className="auto-section" {...rowFadeUp(index, 0.07)}>
      <div className="card card-flush">
        <div className="auto-card-head">
          <div>
            <h2 className="auto-card-title">
              <TrendUp size={19} weight="duotone" /> Coverage by Node
            </h2>
            <div className="auto-card-sub">Worst-automated flows first</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Node</th>
                <th>Group</th>
                <th className="num">Cases</th>
                <th className="num">Automated</th>
                <th>% Automated</th>
                <th className="num">Pass / Fail</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ node, stats, autoPct }) => (
                <tr key={node.id}>
                  <td>
                    <Link className="cov-node-link" to={`/navflow?node=${node.id}`}>
                      {node.label}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-outline">{node.group}</span>
                  </td>
                  <td className="num">{stats.total}</td>
                  <td className="num">{stats.automated}</td>
                  <td>
                    <div className="cov-bar">
                      <ProgressBar value={autoPct} showLabel />
                    </div>
                  </td>
                  <td className="num">
                    <span className="pass-num">{stats.passing}</span>
                    <span className="dim-num"> / </span>
                    <span className={stats.failing > 0 ? "fail-num" : "dim-num"}>
                      {stats.failing}
                    </span>
                  </td>
                  <td>
                    <button
                      className="run-btn"
                      title={`Run node: ${node.label}`}
                      aria-label={`Run node: ${node.label}`}
                      onClick={() => triggerDevinSession(`Node: ${node.label}`, "enterprise")}
                    >
                      <Play size={14} weight="duotone" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}
