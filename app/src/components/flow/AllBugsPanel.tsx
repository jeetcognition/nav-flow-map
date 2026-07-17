// Old "Bugs" toolbar view: every known bug in one filterable table.
// Click a row to jump to that page's node on the graph.
import { useMemo, useState } from "react";
import { Bug as BugIcon, X } from "@phosphor-icons/react";
import { getBugs } from "../../data/dataService";
import { allPages, draftBugs } from "../../data/editsService";
import { useDataVersion } from "../../hooks/useData";
import { useEditsVersion } from "../../hooks/useEdits";
import { SEVERITIES, type Severity } from "../../lib/severity";

interface Row {
  id: string;
  severity: Severity;
  status: string;
  pageId: string;
  pageLabel: string;
  title: string;
  caseIds: string[];
  links: Record<string, string | undefined>;
  notes: string;
  isDraft: boolean;
}

export function AllBugsPanel({
  onClose,
  onJump,
}: {
  onClose: () => void;
  onJump: (pageId: string) => void;
}) {
  const dataVersion = useDataVersion();
  const editsVersion = useEditsVersion();
  const [sev, setSev] = useState<"All" | Severity>("All");

  const rows = useMemo<Row[]>(() => {
    const byId = new Map(allPages().map((p) => [p.id, p]));
    const real: Row[] = getBugs().map((b) => ({
      id: b.id,
      severity: b.severity,
      status: b.status,
      pageId: b.nodeId,
      pageLabel: byId.get(b.nodeId)?.label ?? b.nodeId,
      title: b.title,
      caseIds: b.caseIds,
      links: b.links ?? {},
      notes: b.reproSteps,
      isDraft: false,
    }));
    const drafts: Row[] = draftBugs().map((b) => ({
      id: b.id,
      severity: b.severity,
      status: b.status,
      pageId: b.pageId,
      pageLabel: byId.get(b.pageId)?.label ?? b.pageId,
      title: b.title,
      caseIds: b.caseIds,
      links: b.links,
      notes: b.notes,
      isDraft: true,
    }));
    return [...real, ...drafts];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion, editsVersion]);

  const filtered = sev === "All" ? rows : rows.filter((r) => r.severity === sev);

  return (
    <div className="fp-root">
      <header className="fp-head">
        <div className="fp-head-text">
          <div className="fp-title-row">
            <h2 className="fp-title">
              <BugIcon size={17} weight="duotone" /> All bugs{" "}
              <span className="fp-count mono">{rows.length}</span>
            </h2>
          </div>
        </div>
        <button className="fp-close" onClick={onClose} aria-label="Close all bugs">
          <X size={16} weight="bold" />
        </button>
      </header>
      <div className="fp-scroll">
        <div className="fp-filters" role="tablist" aria-label="Severity filter">
          {(["All", ...SEVERITIES] as const).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={sev === s}
              className={`fp-filter ${sev === s ? "is-active" : ""}`}
              onClick={() => setSev(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="fp-table-wrap">
          <table className="fp-table fp-bugs-table">
            <thead>
              <tr>
                <th>Bug</th>
                <th>Sev</th>
                <th>Status</th>
                <th>Page</th>
                <th>Title</th>
                <th>Cases</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={`fp-bugrow ${r.isDraft ? "fp-draft-row" : ""}`}
                  title={r.notes}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === "A") return;
                    onJump(r.pageId);
                  }}
                >
                  <td className="mono fp-td-id">{r.isDraft ? "draft" : r.id}</td>
                  <td>
                    <span className={`fp-sev fp-sev-${r.severity.toLowerCase()}`}>
                      {r.severity}
                    </span>
                  </td>
                  <td>
                    <span className="fp-bstatus">{r.status}</span>
                  </td>
                  <td>{r.pageLabel}</td>
                  <td>{r.title}</td>
                  <td className="mono fp-td-cases">{r.caseIds.join(", ") || "—"}</td>
                  <td>
                    {Object.entries(r.links).map(([k, v]) =>
                      v ? (
                        <a key={k} href={v} target="_blank" rel="noopener noreferrer">
                          {k[0]!.toUpperCase() + k.slice(1)}{" "}
                        </a>
                      ) : null,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fp-note">Click a row to jump to that page's node. Hover for repro notes.</p>
      </div>
    </div>
  );
}
