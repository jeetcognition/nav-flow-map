// Verify queue: possible-bug incidents awaiting a human verdict. Each verdict
// becomes classifier training material via the QA-DEC-025 refiner loop.
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { overrideIncidentCategory } from "../../data/dataService";
import { useApp } from "../../hooks/useApp";
import { ConfidenceMeter } from "../ui/ConfidenceMeter";
import { SeverityBadge } from "../ui/badges";
import { rowFadeUp } from "../../lib/motion";
import { timeAgo } from "../../lib/format";
import type { Incident } from "../../types";

export function VerifyQueue({ incidents }: { incidents: Incident[] }) {
  const { user } = useApp();
  return (
    <>
      <div className="verify-list">
        {incidents.map((inc, i) => (
          <motion.div className="card verify-row" key={inc.id} {...rowFadeUp(i, 0.03)}>
            <div className="verify-main">
              <Link to={`/incidents/${inc.id}`} className="verify-title">
                <SeverityBadge severity={inc.severity} />
                {inc.title}
              </Link>
              <div className="verify-sub">
                Judged <b>possible-bug</b> · <ConfidenceMeter value={inc.ai.confidence} /> ·{" "}
                <span className="mono">{inc.customer}</span> · {timeAgo(inc.createdAt)}
              </div>
            </div>
            <div className="verify-actions">
              <button
                className="btn btn-mini btn-ai-strong"
                onClick={() => overrideIncidentCategory(inc.id, "app-bug", user.id)}
                title="Confirm this is an application bug"
              >
                <CheckCircle size={13} weight="duotone" /> Confirm bug
              </button>
              <button
                className="btn btn-mini"
                onClick={() => overrideIncidentCategory(inc.id, "customer-doubt", user.id)}
                title="Rule this out as not an application bug"
              >
                <XCircle size={13} weight="duotone" /> Not a bug
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="verify-note">
        Every verdict here becomes a fresh exam question for the classifier — rule changes must keep
        passing <span className="mono">eval_classifier.py --gate</span> before they ship.
      </p>
    </>
  );
}
