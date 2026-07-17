// Live Devin sessions panel for the Automation page.
import { ExternalLink } from "../ui/ExternalLink";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowSquareOut, CaretDown, CaretUp, Robot } from "@phosphor-icons/react";
import { EASE, rowFadeUp } from "../../lib/motion";
import { EmptyState } from "../ui/EmptyState";
import { SessionBadge } from "../ui/badges";
import { timeAgo } from "../../lib/format";
import type { DevinSession } from "../../types";

export function SessionsPanel({ sessions, index }: { sessions: DevinSession[]; index: number }) {
  const [showAll, setShowAll] = useState(false);
  const liveCount = sessions.filter((s) => s.status === "queued" || s.status === "running").length;
  const shown = showAll ? sessions : sessions.slice(0, 6);

  return (
    <motion.section className="card auto-section" {...rowFadeUp(index, 0.07)}>
      <div className="auto-card-head">
        <div>
          <h2 className="auto-card-title">
            <Robot size={19} weight="duotone" /> Devin Sessions
          </h2>
          <div className="auto-card-sub">{sessions.length} total</div>
        </div>
        <span className="live-chip">
          {liveCount > 0 && <span className="pulse-dot" aria-hidden />}
          {liveCount} live
        </span>
      </div>
      {sessions.length === 0 ? (
        <EmptyState
          icon={<Robot size={28} weight="duotone" />}
          title="No sessions yet"
          hint="Trigger a run to spin up a Devin session."
        />
      ) : (
        <div className="sessions-list">
          {shown.map((s) => (
            <motion.div
              key={s.id}
              className={`session-row${s.status === "queued" || s.status === "running" ? " is-live" : ""}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <span className="session-id">{s.id}</span>
              <span className="session-scope" title={s.scope}>
                {s.scope}
              </span>
              <SessionBadge status={s.status} />
              <span className="session-time">{timeAgo(s.startedAt)}</span>
              <ExternalLink
                className="session-link"
                href={s.url}
                aria-label={`Open session ${s.id} in Devin`}
              >
                <ArrowSquareOut size={15} weight="duotone" />
              </ExternalLink>
            </motion.div>
          ))}
        </div>
      )}
      {sessions.length > 6 && (
        <button className="btn sessions-expander" onClick={() => setShowAll((v) => !v)}>
          {showAll ? (
            <>
              Show recent <CaretUp size={13} />
            </>
          ) : (
            <>
              Show all ({sessions.length}) <CaretDown size={13} />
            </>
          )}
        </button>
      )}
    </motion.section>
  );
}
