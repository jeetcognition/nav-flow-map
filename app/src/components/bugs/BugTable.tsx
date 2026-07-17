// Table view of issues for the Bugs page.
import { ExternalLink } from "../ui/ExternalLink";
import { type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, LinkSimple, Warning } from "@phosphor-icons/react";
import { getNode, userName } from "../../data/dataService";
import { EmptyState } from "../ui/EmptyState";
import { BugStatusBadge, SeverityBadge } from "../ui/badges";
import { timeAgo } from "../../lib/format";
import type { Bug } from "../../types";

export function BugTable({ bugs }: { bugs: Bug[] }) {
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
