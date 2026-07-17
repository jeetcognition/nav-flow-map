// Filterable, paginated testcase explorer for the Automation page.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CaretDown, Flask, Lightning, MagnifyingGlass, Play } from "@phosphor-icons/react";
import { triggerDevinSession } from "../../data/dataService";
import { rowFadeUp } from "../../lib/motion";
import { EmptyState } from "../ui/EmptyState";
import { AutomationBadge, PriorityBadge } from "../ui/badges";
import type { NavNode, TestCase } from "../../types";

const SUITE_CLS: Record<TestCase["suite"], string> = {
  Sanity: "badge-blue",
  Regression: "badge-outline",
  Draft: "badge-gray",
};

const PAGE_SIZE = 50;

export function CaseExplorer({
  cases,
  nodes,
  nodeLabel,
  caseParam,
  index,
}: {
  cases: TestCase[];
  nodes: NavNode[];
  nodeLabel: Map<string, string>;
  caseParam: string;
  index: number;
}) {
  const [suite, setSuite] = useState("all");
  const [auto, setAuto] = useState("all");
  const [prio, setPrio] = useState("all");
  const [nodeId, setNodeId] = useState("all");
  const [q, setQ] = useState(caseParam);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return cases.filter(
      (c) =>
        (suite === "all" || c.suite === suite) &&
        (auto === "all" || c.automation === auto) &&
        (prio === "all" || c.priority === prio) &&
        (nodeId === "all" || c.nodeId === nodeId) &&
        (!term || c.id.toLowerCase().includes(term) || c.title.toLowerCase().includes(term)),
    );
  }, [cases, suite, auto, prio, nodeId, q]);

  const shown = filtered.slice(0, limit);
  const resetPage = () => setLimit(PAGE_SIZE);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allShownSelected = shown.length > 0 && shown.every((c) => selected.has(c.id));
  const toggleAllShown = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) shown.forEach((c) => next.delete(c.id));
      else shown.forEach((c) => next.add(c.id));
      return next;
    });

  const runSelected = () => {
    triggerDevinSession(`${selected.size} selected cases`, "enterprise");
    setSelected(new Set());
  };

  return (
    <motion.section className="card auto-section" {...rowFadeUp(index, 0.07)}>
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title">
            <Flask size={19} weight="duotone" /> Testcase Explorer
          </h2>
          <div className="auto-card-sub">
            {filtered.length} of {cases.length} cases
          </div>
        </div>
        {selected.size > 0 && (
          <motion.button
            className="btn btn-primary"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={runSelected}
          >
            <Lightning size={15} weight="duotone" /> Run selected ({selected.size})
          </motion.button>
        )}
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <MagnifyingGlass size={14} weight="duotone" />
          <input
            type="search"
            placeholder="Search by case ID or title…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              resetPage();
            }}
            aria-label="Search testcases"
          />
        </div>
        <select
          value={suite}
          onChange={(e) => {
            setSuite(e.target.value);
            resetPage();
          }}
          aria-label="Filter by suite"
        >
          <option value="all">All suites</option>
          <option value="Sanity">Sanity</option>
          <option value="Regression">Regression</option>
          <option value="Draft">Draft</option>
        </select>
        <select
          value={auto}
          onChange={(e) => {
            setAuto(e.target.value);
            resetPage();
          }}
          aria-label="Filter by automation status"
        >
          <option value="all">All automation</option>
          <option value="automated">Automated</option>
          <option value="manual">Manual</option>
          <option value="in-progress">In Progress</option>
          <option value="not-automatable">Not Automatable</option>
        </select>
        <select
          value={prio}
          onChange={(e) => {
            setPrio(e.target.value);
            resetPage();
          }}
          aria-label="Filter by priority"
        >
          <option value="all">All priorities</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
        </select>
        <select
          value={nodeId}
          onChange={(e) => {
            setNodeId(e.target.value);
            resetPage();
          }}
          aria-label="Filter by node"
        >
          <option value="all">All nodes</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Flask size={28} weight="duotone" />}
          title="No cases match these filters"
          hint="Try widening the suite, status, or search term."
        />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 34 }}>
                  <input
                    type="checkbox"
                    className="tc-check"
                    checked={allShownSelected}
                    onChange={toggleAllShown}
                    aria-label="Select all visible cases"
                  />
                </th>
                <th>Case ID</th>
                <th>Title</th>
                <th>Node</th>
                <th>Suite</th>
                <th>Priority</th>
                <th>Automation</th>
                <th>Flags</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className={c.id === caseParam ? "row-hl" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      className="tc-check"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`Select ${c.id}`}
                    />
                  </td>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {c.id}
                  </td>
                  <td>
                    <span className="tc-title" title={c.title}>
                      {c.title}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{nodeLabel.get(c.nodeId) ?? c.nodeId}</td>
                  <td>
                    <span className={`badge ${SUITE_CLS[c.suite]}`}>{c.suite}</span>
                  </td>
                  <td>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td>
                    <AutomationBadge status={c.automation} />
                  </td>
                  <td>
                    <span className="tc-badges">
                      {c.flaky && <span className="badge badge-amber">Flaky</span>}
                      {(c.source === "ai-from-incident" || c.source === "ai-suggested") && (
                        <span className="badge badge-purple">AI</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <button
                      className="run-btn"
                      title={`Run case ${c.id}`}
                      aria-label={`Run case ${c.id}`}
                      onClick={() => triggerDevinSession(`Case: ${c.id}`, "enterprise")}
                    >
                      <Play size={14} weight="duotone" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-foot">
            <span className="num">
              Showing {shown.length} of {filtered.length}
            </span>
            {filtered.length > limit && (
              <button className="btn" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
                <CaretDown size={13} /> Load more
              </button>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
