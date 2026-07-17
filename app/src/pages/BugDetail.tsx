import { ExternalLink } from "../components/ui/ExternalLink";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowSquareOut, Camera, FileDashed, LinkSimple } from "@phosphor-icons/react";
import { getBug, getNode, getTestCase, updateBugStatus, userName } from "../data/dataService";
import { useDataVersion } from "../hooks/useData";
import { EmptyState } from "../components/ui/EmptyState";
import { BugStatusBadge, EnvBadge, SeverityBadge } from "../components/ui/badges";
import { fadeUp } from "../lib/motion";
import { BUG_STATUS_LABEL, BUG_STATUS_ORDER } from "../lib/bugStatus";
import { formatDate } from "../lib/format";
import "../styles/bugs.css";

export default function BugDetail() {
  useDataVersion();
  const { bugId } = useParams<{ bugId: string }>();
  const bug = bugId ? getBug(bugId) : undefined;

  if (!bug) {
    return (
      <div className="page">
        <Link to="/bugs" className="back-link">
          <ArrowLeft size={14} weight="bold" /> Issues
        </Link>
        <div className="card">
          <EmptyState
            icon={<FileDashed size={30} weight="duotone" />}
            title="Issue not found"
            hint={`No issue with id "${bugId ?? ""}" exists.`}
            action={
              <Link to="/bugs" className="btn">
                <ArrowLeft size={14} weight="bold" /> Back to Issues
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const node = getNode(bug.nodeId);

  return (
    <div className="page">
      <motion.div {...fadeUp(0)}>
        <Link to="/bugs" className="back-link">
          <ArrowLeft size={14} weight="bold" /> Issues
        </Link>
      </motion.div>

      <motion.div className="bug-detail-head" {...fadeUp(0.04)}>
        <div className="bug-detail-title">
          <span className="bug-id">{bug.id}</span>
          <h1 className="page-title">{bug.title}</h1>
          <div className="bug-detail-badges">
            <SeverityBadge severity={bug.severity} />
            <BugStatusBadge status={bug.status} />
            <EnvBadge env={bug.environment} />
          </div>
        </div>
        <div className="status-steps" role="group" aria-label="Set status">
          {BUG_STATUS_ORDER.map((s) => (
            <button
              key={s}
              className={s === bug.status ? "active" : ""}
              aria-pressed={s === bug.status}
              onClick={() => updateBugStatus(bug.id, s)}
            >
              {BUG_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="bug-detail-grid">
        <div className="bug-detail-col">
          <motion.div className="card" {...fadeUp(0.08)}>
            <div className="bug-card-title">Repro steps</div>
            <pre className="repro-pre">{bug.reproSteps}</pre>
          </motion.div>

          <motion.div className="card" {...fadeUp(0.12)}>
            <div className="bug-card-title">Linked test cases</div>
            {bug.caseIds.length === 0 ? (
              <EmptyState title="No linked cases" hint="Link a regression case from Automation." />
            ) : (
              bug.caseIds.map((cid) => {
                const tc = getTestCase(cid);
                return (
                  <div className="case-link-row" key={cid}>
                    <Link to={`/automation?case=${cid}`} className="mono">
                      {cid}
                    </Link>
                    <span className="case-link-title">{tc?.title ?? ""}</span>
                  </div>
                );
              })
            )}
          </motion.div>
        </div>

        <div className="bug-detail-col">
          <motion.div className="card" {...fadeUp(0.1)}>
            <div className="bug-card-title">Details</div>
            <dl className="meta-list">
              <div className="meta-row">
                <dt>Node</dt>
                <dd>
                  <Link to={`/map?node=${bug.nodeId}`}>{node?.label ?? bug.nodeId}</Link>
                </dd>
              </div>
              <div className="meta-row">
                <dt>Reporter</dt>
                <dd>{userName(bug.reporter)}</dd>
              </div>
              <div className="meta-row">
                <dt>Created</dt>
                <dd>{formatDate(bug.createdAt)}</dd>
              </div>
              <div className="meta-row">
                <dt>Incident</dt>
                <dd>
                  {bug.incidentId ? (
                    <Link to={`/incidents/${bug.incidentId}`} className="mono">
                      {bug.incidentId}
                    </Link>
                  ) : (
                    <span className="text-quiet">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </motion.div>

          <motion.div className="card" {...fadeUp(0.14)}>
            <div className="bug-card-title">Attachments</div>
            {!bug.links.jam && !bug.links.linear ? (
              <EmptyState
                icon={<Camera size={24} weight="duotone" />}
                title="No attachments"
                hint="Add a Jam link to capture the repro."
              />
            ) : (
              <div className="attach-list">
                {bug.links.jam && (
                  <div className="attach-row">
                    <Camera size={16} weight="duotone" className="attach-icon" />
                    <input readOnly value={bug.links.jam} aria-label="Jam link" />
                    <ExternalLink href={bug.links.jam} className="link-chip" aria-label="Open Jam recording">
                      <ArrowSquareOut size={13} weight="duotone" /> Open
                    </ExternalLink>
                  </div>
                )}
                {bug.links.linear && (
                  <div className="attach-row">
                    <ExternalLink href={bug.links.linear} className="link-chip">
                      <LinkSimple size={13} weight="duotone" /> Linear issue
                    </ExternalLink>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
