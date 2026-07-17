// Old NavFlow side panel content, restyled with the new UI:
// route, description, How to reach, Also reachable via, filterable testcase
// table (+ automation status), bugs table, inline edit mode, draft testcases,
// report bug, and the new "Run automation for this node" action.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bug as BugIcon,
  ListChecks,
  Path,
  PencilSimple,
  Play,
  Plus,
  X,
} from "@phosphor-icons/react";
import { getBugs, getSessions, getTestCases, triggerDevinSession } from "../../data/dataService";
import {
  addDraftCase,
  draftBugs,
  draftCasesFor,
  extraLinks,
  mergedEdits,
  pathTo,
  removeLink,
  setCaseOverride,
  setPageOverride,
  allPages,
} from "../../data/editsService";
import { useDataVersion } from "../../hooks/useData";
import { useEditsVersion } from "../../hooks/useEdits";
import { DEFAULT_SURFACE } from "../../lib/config";
import { AutomationBadge, PriorityBadge, SessionBadge } from "../ui/badges";
import { BugsTable } from "./BugsTable";
import { EditableCell, EditableText } from "./editable";
import type { NavNode, TestCase } from "../../types";

const GROUP_LABEL: Record<NavNode["group"], string> = {
  entry: "Entry",
  suborg: "Sub-org",
  personal: "Personal",
  enterprise: "Enterprise",
};

const FILTERS = ["All", "Sanity", "Regression"] as const;
type Filter = (typeof FILTERS)[number];

interface Props {
  page: NavNode;
  highlightCase: string | null;
  onClose: () => void;
  onReportBug: () => void;
}

export function FlowPanel({ page, highlightCase, onClose, onReportBug }: Props) {
  const dataVersion = useDataVersion();
  const editsVersion = useEditsVersion();
  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [draftText, setDraftText] = useState("");
  const [draftOpen, setDraftOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const session = sessionId ? getSessions().find((s) => s.id === sessionId) : undefined;

  const overrides = useMemo(
    () => mergedEdits().caseOverrides,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editsVersion],
  );

  const cases = useMemo(() => {
    const base = getTestCases()
      .filter((c) => c.nodeId === page.id)
      .map((c) => ({ ...c, ...(overrides[c.id] ?? {}) }) as TestCase);
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, dataVersion, overrides]);

  const drafts = useMemo(
    () => draftCasesFor(page.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page.id, editsVersion],
  );

  const bugs = useMemo(() => {
    const real = getBugs().filter((b) => b.nodeId === page.id);
    const draft = draftBugs().filter((b) => b.pageId === page.id);
    return { real, draft };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, dataVersion, editsVersion]);

  const alsoReachable = useMemo(() => {
    const byId = new Map(allPages().map((p) => [p.id, p]));
    return extraLinks()
      .filter((l) => l.target === page.id)
      .map((l) => ({ ...l, sourceLabel: byId.get(l.source)?.label ?? l.source }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, editsVersion]);

  const steps = useMemo(
    () => pathTo(page),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, editsVersion],
  );

  const filtered = filter === "All" ? cases : cases.filter((c) => c.suite === filter);
  const showDrafts = filter === "All" && drafts.length > 0;

  // scroll a deep-linked case row into view (⌘K search → testcase hit)
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!highlightCase || !tableRef.current) return;
    const row = tableRef.current.querySelector(`[data-case="${CSS.escape(highlightCase)}"]`);
    row?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightCase, filtered.length]);

  const runAutomation = () => {
    if (session && session.status !== "done" && session.status !== "failed") return;
    const s = triggerDevinSession(`Node: ${page.label}`, DEFAULT_SURFACE);
    setSessionId(s.id);
  };

  const addDraft = () => {
    const text = draftText.trim();
    if (!text) return;
    addDraftCase(page.id, text);
    setDraftText("");
    setDraftOpen(false);
  };

  return (
    <div className="fp-root">
      <header className="fp-head">
        <div className="fp-head-text">
          <div className="fp-title-row">
            <EditableText
              as="h2"
              className="fp-title"
              value={page.label}
              editable={editMode}
              onCommit={(v) => setPageOverride(page.id, "label", v)}
            />
            <span className={`badge badge-outline fp-group fp-group-${page.group}`}>
              {GROUP_LABEL[page.group]}
            </span>
          </div>
          <EditableText
            className="fp-route mono"
            value={page.route}
            editable={editMode}
            onCommit={(v) => setPageOverride(page.id, "route", v)}
          />
        </div>
        <button className="fp-close" onClick={onClose} aria-label="Close panel">
          <X size={16} weight="bold" />
        </button>
      </header>

      <div className="fp-scroll">
        <div className="fp-actions">
          <button
            className={`btn fp-btn ${editMode ? "is-active" : ""}`}
            onClick={() => setEditMode((v) => !v)}
          >
            <PencilSimple size={13} weight="bold" /> {editMode ? "Done editing" : "Edit"}
          </button>
          <button className="btn fp-btn" onClick={() => setDraftOpen((v) => !v)}>
            <Plus size={13} weight="bold" /> Draft test case
          </button>
          <button className="btn fp-btn" onClick={onReportBug}>
            <BugIcon size={13} weight="bold" /> Report bug
          </button>
          <button
            className="btn btn-primary fp-btn"
            onClick={runAutomation}
            disabled={!!session && (session.status === "queued" || session.status === "running")}
          >
            <Play size={13} weight="duotone" /> Run automation
          </button>
        </div>
        {session && (
          <div className="fp-session">
            <SessionBadge status={session.status} />
            <span className="mono fp-session-id">{session.id}</span>
          </div>
        )}

        {draftOpen && (
          <div className="fp-draft-form">
            <input
              autoFocus
              value={draftText}
              placeholder="Rough one-liner — the AI promotion pass rewrites it properly later"
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addDraft();
                if (e.key === "Escape") setDraftOpen(false);
              }}
            />
            <button className="btn fp-btn" onClick={addDraft} disabled={!draftText.trim()}>
              Add draft
            </button>
          </div>
        )}

        <EditableText
          as="p"
          className="fp-desc"
          value={page.desc || "—"}
          editable={editMode}
          onCommit={(v) => setPageOverride(page.id, "desc", v)}
        />

        <section className="fp-section">
          <h3 className="fp-section-title">
            <Path size={14} weight="duotone" /> How to reach
          </h3>
          <ol className="fp-path">
            {steps.map((s, i) =>
              editMode && s.pageId ? (
                <EditableText
                  key={`${s.pageId}-${i}`}
                  as="li"
                  value={s.text}
                  editable
                  onCommit={(v) => setPageOverride(s.pageId!, "via", v)}
                />
              ) : (
                <li key={`${s.pageId ?? "root"}-${i}`}>{s.text}</li>
              ),
            )}
          </ol>
        </section>

        {alsoReachable.length > 0 && (
          <section className="fp-section">
            <h3 className="fp-section-title">
              <Path size={14} weight="duotone" /> Also reachable via
            </h3>
            <ol className="fp-path">
              {alsoReachable.map((l) => (
                <li key={`${l.source}-${l.target}`}>
                  From <b>{l.sourceLabel}</b>: {l.via || "Navigate directly"}
                  {editMode && (
                    <button
                      className="fp-unlink"
                      onClick={() => removeLink(l.source, l.target)}
                      title="Remove this extra link"
                    >
                      remove
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

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
                        <span className={`fp-suite fp-suite-${c.suite.toLowerCase()}`}>
                          {c.suite}
                        </span>
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

        <BugsTable real={bugs.real} draft={bugs.draft} />

        {editMode && (
          <p className="fp-note">
            Click any dashed field (page name, route, description, How-to-reach steps, Steps,
            Expected) to edit — changes save to this browser immediately; use “Save to repo” to
            commit them for everyone.
          </p>
        )}
      </div>
    </div>
  );
}
