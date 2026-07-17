import { useState } from "react";
import { motion } from "framer-motion";
import { Kanban, MagnifyingGlass, Sparkle, Table } from "@phosphor-icons/react";
import { getBugs } from "../data/dataService";
import { useDataVersion } from "../hooks/useData";
import { fadeUp } from "../lib/motion";
import { BUG_STATUS_LABEL, BUG_STATUS_ORDER } from "../lib/bugStatus";
import { SEVERITIES } from "../lib/severity";
import { BugTable } from "../components/bugs/BugTable";
import { BugBoard } from "../components/bugs/BugBoard";
import { DraftBugModal } from "../components/bugs/DraftBugModal";
import "../styles/bugs.css";

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
