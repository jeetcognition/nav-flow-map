import { ExternalLink } from "../components/ui/ExternalLink";
import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CaretRight,
  CircleNotch,
  DotsThree,
  Kanban,
  LinkSimple,
  MagnifyingGlass,
  Sparkle,
  Table,
  Warning,
} from "@phosphor-icons/react";
import {
  addBug,
  getBugs,
  getNode,
  getNodes,
  getUser,
  newId,
  updateBugStatus,
  userName,
} from "../data/dataService";
import { draftBugFromNotes, findDuplicateBugs } from "../data/aiService";
import { useDataVersion } from "../hooks/useData";
import { useApp } from "../hooks/useApp";
import { useClickOutside } from "../hooks/useClickOutside";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { BugStatusBadge, SeverityBadge } from "../components/ui/badges";
import { EASE, fadeUp } from "../lib/motion";
import { BUG_STATUS_COLOR, BUG_STATUS_LABEL, BUG_STATUS_ORDER } from "../lib/bugStatus";
import { SEVERITIES, type Severity } from "../lib/severity";
import { timeAgo } from "../lib/format";
import type { Bug } from "../types";
import "../styles/bugs.css";

// ---------------------------------------------------------------- list page

export default function Bugs() {
  useDataVersion();
  const [view, setView] = useState<"table" | "board">("table");
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [draftOpen, setDraftOpen] = useState(false);

  const bugs = getBugs();
  const q = query.trim().toLowerCase();
  const filtered = bugs.filter(
    (b) =>
      (severity === "all" || b.severity === severity) &&
      (status === "all" || b.status === status) &&
      (q === "" || b.title.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)),
  );

  return (
    <div className="page">
      <motion.div className="page-head" {...fadeUp(0)}>
        <div>
          <h1 className="page-title">Issues</h1>
          <p className="page-sub">
            Track open issues through to verified — drag them forward on the board.
          </p>
        </div>
        <div className="bugs-head-actions">
          <div className="seg" role="tablist" aria-label="View">
            <button
              className={view === "table" ? "active" : ""}
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
            >
              <Table size={15} weight="duotone" /> Table
            </button>
            <button
              className={view === "board" ? "active" : ""}
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
            >
              <Kanban size={15} weight="duotone" /> Board
            </button>
          </div>
          <button className="btn btn-ai" onClick={() => setDraftOpen(true)}>
            <Sparkle size={15} weight="duotone" /> Draft with AI
          </button>
        </div>
      </motion.div>

      <motion.div className="bugs-filters" {...fadeUp(0.05)}>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          aria-label="Severity"
        >
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All statuses</option>
          {BUG_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {BUG_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="bugs-search">
          <span className="bugs-search-icon">
            <MagnifyingGlass size={15} weight="duotone" />
          </span>
          <input
            placeholder="Search title or id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search issues"
          />
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        {view === "table" ? <BugTable bugs={filtered} /> : <BugBoard bugs={filtered} />}
      </motion.div>

      <DraftBugModal open={draftOpen} onClose={() => setDraftOpen(false)} />
    </div>
  );
}

// ---------------------------------------------------------------- table view

function BugTable({ bugs }: { bugs: Bug[] }) {
  const navigate = useNavigate();
  if (bugs.length === 0) {
    return (
      <EmptyState
        icon={<Warning size={28} weight="duotone" />}
        title="No issues match"
        hint="Try loosening the filters or clearing the search."
      />
    );
  }
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>Test cases</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Area</th>
            <th>Reporter</th>
            <th>Age</th>
            <th>Links</th>
          </tr>
        </thead>
        <tbody>
          {bugs.map((b) => {
            const node = getNode(b.nodeId);
            const open = () => navigate(`/bugs/${b.id}`);
            const onKeyDown = (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            };
            return (
              <tr
                key={b.id}
                className="clickable"
                role="link"
                tabIndex={0}
                aria-label={`Open issue ${b.id}`}
                onClick={open}
                onKeyDown={onKeyDown}
              >
                <td className="mono">{b.id}</td>
                <td className="mono bug-cases-cell" title={b.caseIds.join(", ")}>
                  {b.caseIds.join(", ") || "\u2014"}
                </td>
                <td>{b.title}</td>
                <td>
                  <SeverityBadge severity={b.severity} />
                </td>
                <td>
                  <BugStatusBadge status={b.status} />
                </td>
                <td>
                  <Link to={`/navflow?node=${b.nodeId}`} onClick={(e) => e.stopPropagation()}>
                    {node?.label ?? b.nodeId}
                  </Link>
                </td>
                <td>{userName(b.reporter)}</td>
                <td className="bug-age-cell">{timeAgo(b.createdAt)}</td>
                <td>
                  <span className="bug-links-cell">
                    {b.links.linear && (
                      <ExternalLink
                        className="link-chip"
                        href={b.links.linear}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkSimple size={12} weight="duotone" /> Linear
                      </ExternalLink>
                    )}
                    {b.links.jam && (
                      <ExternalLink
                        className="link-chip"
                        href={b.links.jam}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Camera size={12} weight="duotone" /> Jam
                      </ExternalLink>
                    )}
                    {!b.links.linear && !b.links.jam && <span className="text-quiet">—</span>}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------- board view

function BugBoard({ bugs }: { bugs: Bug[] }) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  return (
    <div className="kanban">
      {BUG_STATUS_ORDER.map((status) => {
        const col = bugs.filter((b) => b.status === status);
        return (
          <div
            key={status}
            className="kanban-col"
            style={{ "--col-color": BUG_STATUS_COLOR[status] } as CSSProperties}
          >
            <div className="kanban-col-head">
              <span>{BUG_STATUS_LABEL[status]}</span>
              <span className="kanban-col-count">{col.length}</span>
            </div>
            <AnimatePresence initial={false}>
              {col.map((b) => (
                <BoardCard
                  key={b.id}
                  bug={b}
                  menuOpen={menuFor === b.id}
                  onToggleMenu={() => setMenuFor((cur) => (cur === b.id ? null : b.id))}
                  onCloseMenu={() => setMenuFor(null)}
                />
              ))}
            </AnimatePresence>
            {col.length === 0 && <div className="kanban-empty">Nothing here</div>}
          </div>
        );
      })}
    </div>
  );
}

function BoardCard({
  bug,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: {
  bug: Bug;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}) {
  const navigate = useNavigate();
  const node = getNode(bug.nodeId);
  const reporter = getUser(bug.reporter);
  const nextStatus = BUG_STATUS_ORDER[BUG_STATUS_ORDER.indexOf(bug.status) + 1];
  const menuRef = useClickOutside<HTMLSpanElement>(() => {
    if (menuOpen) onCloseMenu();
  });

  return (
    <motion.div
      layout
      layoutId={bug.id}
      className="kanban-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, ease: EASE }}
      onClick={() => navigate(`/bugs/${bug.id}`)}
    >
      <div className="kanban-card-top">
        <span className="kanban-card-id">{bug.id}</span>
        <SeverityBadge severity={bug.severity} />
      </div>
      <div className="kanban-card-title">{bug.title}</div>
      <div className="kanban-card-node">{node?.label ?? bug.nodeId}</div>
      <div className="kanban-card-foot">
        <span
          className="avatar-dot"
          style={{ background: reporter?.color ?? "var(--text-3)" }}
          title={userName(bug.reporter)}
        >
          {reporter?.initials ?? "?"}
        </span>
        <span>{timeAgo(bug.createdAt)}</span>
        <span className="kanban-card-actions" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          {nextStatus && (
            <button
              className="kb-icon-btn"
              title={`Advance to ${BUG_STATUS_LABEL[nextStatus]}`}
              aria-label={`Advance ${bug.id} to ${BUG_STATUS_LABEL[nextStatus]}`}
              onClick={() => updateBugStatus(bug.id, nextStatus)}
            >
              <CaretRight size={14} weight="bold" />
            </button>
          )}
          <button
            className="kb-icon-btn"
            title="Move to…"
            aria-label={`Move ${bug.id} to another status`}
            onClick={onToggleMenu}
          >
            <DotsThree size={16} weight="bold" />
          </button>
          {menuOpen && (
            <div className="card-menu" role="menu">
              <div className="card-menu-label">Move to…</div>
              {BUG_STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  role="menuitem"
                  disabled={s === bug.status}
                  onClick={() => {
                    updateBugStatus(bug.id, s);
                    onCloseMenu();
                  }}
                >
                  {BUG_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- AI draft modal

interface DraftForm {
  title: string;
  severity: Bug["severity"];
  nodeId: string;
  environment: Bug["environment"];
  reproSteps: string;
  jam: string;
}

function DraftBugModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useApp();
  const nodes = getNodes();
  const [notes, setNotes] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [form, setForm] = useState<DraftForm | null>(null);
  const [dups, setDups] = useState<{ id: string; title: string; score: number }[]>([]);
  const [dupsLoading, setDupsLoading] = useState(false);

  const reset = () => {
    setNotes("");
    setDrafting(false);
    setForm(null);
    setDups([]);
    setDupsLoading(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  const runDraft = async () => {
    if (!notes.trim() || drafting) return;
    setDrafting(true);
    const draft = await draftBugFromNotes(notes);
    setForm({
      title: draft.title,
      severity: draft.severity,
      nodeId: nodes[0]?.id ?? "",
      environment: "staging",
      reproSteps: `${draft.reproSteps}\n\nExpected: ${draft.expected}\nActual: ${draft.actual}`,
      jam: "",
    });
    setDrafting(false);
  };

  // duplicate scan whenever the (editable) title settles
  const title = form?.title ?? "";
  useEffect(() => {
    if (!open || !title.trim()) {
      setDups([]);
      return;
    }
    let cancelled = false;
    setDupsLoading(true);
    const t = setTimeout(() => {
      findDuplicateBugs(title)
        .then((res) => {
          if (cancelled) return;
          setDups(res);
          setDupsLoading(false);
        })
        .catch(() => {
          // duplicate scan is advisory — degrade to "no matches" instead of hanging
          if (cancelled) return;
          setDups([]);
          setDupsLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [title, open]);

  const save = () => {
    if (!form || !form.title.trim()) return;
    addBug({
      id: newId("BUG"),
      title: form.title.trim(),
      severity: form.severity,
      status: "open",
      surfaceId: "enterprise",
      nodeId: form.nodeId,
      caseIds: [],
      links: { jam: form.jam.trim() || undefined },
      reproSteps: form.reproSteps,
      environment: form.environment,
      reporter: user.id,
      createdAt: new Date().toISOString(),
      incidentId: null,
    });
    close();
  };

  const set = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <Modal open={open} onClose={close} title="Draft bug report" width={620}>
      <div className="draft-form">
        <div className="field">
          <label htmlFor="draft-notes">Raw notes</label>
          <textarea
            id="draft-notes"
            placeholder="Paste raw notes/observations…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={drafting}
          />
        </div>
        <div className="draft-actions">
          {drafting && (
            <span className="ai-thinking">
              <CircleNotch size={15} weight="bold" className="spin" /> Drafting…
            </span>
          )}
          <button className="btn btn-ai" onClick={runDraft} disabled={drafting || !notes.trim()}>
            <Sparkle size={15} weight="duotone" /> {form ? "Re-draft with AI" : "Draft with AI"}
          </button>
        </div>

        {form && (
          <motion.div
            className="draft-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            {(dupsLoading || dups.length > 0) && (
              <div className="dup-strip">
                <div className="dup-strip-head">
                  <Warning size={15} weight="duotone" />
                  {dupsLoading ? "Scanning for duplicates…" : "Possible duplicates:"}
                </div>
                {!dupsLoading &&
                  dups.map((d) => (
                    <div className="dup-item" key={d.id}>
                      <Link to={`/bugs/${d.id}`} className="mono" onClick={close}>
                        {d.id}
                      </Link>
                      <span>{d.title}</span>
                      <span className="dup-score">
                        {Math.round(d.score * 100)}% — looks similar to {d.id}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <div className="field">
              <label htmlFor="draft-title">Title</label>
              <input
                id="draft-title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="draft-sev">Severity</label>
                <select
                  id="draft-sev"
                  value={form.severity}
                  onChange={(e) => set("severity", e.target.value as Severity)}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="draft-node">Node</label>
                <select
                  id="draft-node"
                  value={form.nodeId}
                  onChange={(e) => set("nodeId", e.target.value)}
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="draft-env">Environment</label>
                <select
                  id="draft-env"
                  value={form.environment}
                  onChange={(e) => set("environment", e.target.value as Bug["environment"])}
                >
                  <option value="staging">staging</option>
                  <option value="beta">beta</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="draft-repro">Repro steps</label>
              <textarea
                id="draft-repro"
                className="draft-textarea-tall"
                value={form.reproSteps}
                onChange={(e) => set("reproSteps", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="draft-jam">Jam link (optional)</label>
              <input
                id="draft-jam"
                placeholder="https://jam.dev/c/…"
                value={form.jam}
                onChange={(e) => set("jam", e.target.value)}
              />
            </div>
            <div className="draft-actions">
              <button className="btn" onClick={close}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={save} disabled={!form.title.trim()}>
                Save bug
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
