// Filterable test-case table (+ draft rows) for the NavFlow side panel.
import { useEffect, useRef, useState } from "react";
import { ListChecks } from "@phosphor-icons/react";
import { setCaseOverride } from "../../data/editsService";
import { AutomationBadge, PriorityBadge } from "../ui/badges";
import { EditableCell } from "./editable";
import type { TestCase } from "../../types";

const FILTERS = ["All", "Sanity", "Regression"] as const;
type Filter = (typeof FILTERS)[number];

interface DraftCase {
  key: string;
  text: string;
}

export function FlowPanelCaseTable({
  cases,
  drafts,
  editMode,
  highlightCase,
}: {
  cases: TestCase[];
  drafts: DraftCase[];
  editMode: boolean;
  highlightCase: string | null;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const filtered = filter === "All" ? cases : cases.filter((c) => c.suite === filter);
  const showDrafts = filter === "All" && drafts.length > 0;

  // scroll a deep-linked case row into view (⌘K search → testcase hit)
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!highlightCase || !tableRef.current) return;
    const row = tableRef.current.querySelector(`[data-case="${CSS.escape(highlightCase)}"]`);
    row?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightCase, filtered.length]);

  return (
    <section className="fp-section">
      <h3 className="fp-section-title">
        <ListChecks size={14} weight="duotone" /> Test cases{" "}
        <span className="fp-count mono">{cases.length + drafts.length}</span>
      </h3>
      <div className="fp-filters" role="tablist" aria-label="Suite filter">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`fp-filter ${filter === f ? "is-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {filtered.length === 0 && !showDrafts ? (
        <p className="fp-empty">
          No {filter === "All" ? "" : `${filter} `}test cases linked to this page.
        </p>
      ) : (
        <div className="fp-table-wrap" ref={tableRef}>
          <table className="fp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Suite</th>
                <th>Pri</th>
                <th>Auto</th>
                <th>Steps</th>
                <th>Expected</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  data-case={c.id}
                  className={highlightCase === c.id ? "is-highlight" : ""}
                >
                  <td className="mono fp-td-id" title={c.title}>
                    {c.id}
                  </td>
                  <td>
                    <span className={`fp-suite fp-suite-${c.suite.toLowerCase()}`}>{c.suite}</span>
                  </td>
                  <td>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td>
                    <AutomationBadge status={c.automation} />
                  </td>
                  <EditableCell
                    value={c.steps}
                    editable={editMode}
                    onCommit={(v) => setCaseOverride(c.id, "steps", v)}
                  />
                  <EditableCell
                    value={c.expected}
                    editable={editMode}
                    onCommit={(v) => setCaseOverride(c.id, "expected", v)}
                  />
                </tr>
              ))}
              {showDrafts &&
                drafts.map((d) => (
                  <tr key={d.key} className="fp-draft-row" data-case={d.key}>
                    <td className="mono fp-td-id">draft</td>
                    <td>
                      <span className="fp-suite fp-suite-draft">Draft</span>
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <EditableCell
                      value={d.text}
                      editable={editMode}
                      onCommit={(v) => setCaseOverride(d.key, "steps", v)}
                    />
                    <td className="fp-td-muted">AI rewrite pending</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
