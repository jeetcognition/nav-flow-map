// Kanban board view of issues for the Bugs page.
import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CaretRight, DotsThree } from "@phosphor-icons/react";
import { getNode, getUser, updateBugStatus, userName } from "../../data/dataService";
import { useClickOutside } from "../../hooks/useClickOutside";
import { SeverityBadge } from "../ui/badges";
import { EASE } from "../../lib/motion";
import { BUG_STATUS_COLOR, BUG_STATUS_LABEL, BUG_STATUS_ORDER } from "../../lib/bugStatus";
import { timeAgo } from "../../lib/format";
import type { Bug } from "../../types";

export function BugBoard({ bugs }: { bugs: Bug[] }) {
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
