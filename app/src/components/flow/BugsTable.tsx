// Per-node bugs table (old app format): real bugs from the data layer plus
// draft bugs filed in-app that the AI promotion pass turns into BUG-NNN.
import { Bug as BugIcon } from "@phosphor-icons/react";
import type { Bug } from "../../types";
import type { DraftBug } from "../../data/editsService";

function LinkCells({ links }: { links: Record<string, string | undefined> }) {
  const entries = Object.entries(links).filter(([, v]) => v);
  if (entries.length === 0) return <>—</>;
  return (
    <>
      {entries.map(([k, v]) => (
        <a key={k} href={v} target="_blank" rel="noopener noreferrer">
          {k[0]!.toUpperCase() + k.slice(1)}{" "}
        </a>
      ))}
    </>
  );
}

export function BugsTable({ real, draft }: { real: Bug[]; draft: DraftBug[] }) {
  const total = real.length + draft.length;
  if (total === 0) return null;
  return (
    <section className="fp-section">
      <h3 className="fp-section-title">
        <BugIcon size={14} weight="duotone" /> Bugs <span className="fp-count mono">{total}</span>
      </h3>
      <div className="fp-table-wrap">
        <table className="fp-table fp-bugs-table">
          <thead>
            <tr>
              <th>Bug</th>
              <th>Sev</th>
              <th>Status</th>
              <th>Title</th>
              <th>Cases</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {real.map((b) => (
              <tr key={b.id} title={b.reproSteps}>
                <td className="mono fp-td-id">{b.id}</td>
                <td>
                  <span className={`fp-sev fp-sev-${b.severity.toLowerCase()}`}>{b.severity}</span>
                </td>
                <td>
                  <span className="fp-bstatus">{b.status}</span>
                </td>
                <td>{b.title}</td>
                <td className="mono fp-td-cases">{b.caseIds.join(", ") || "—"}</td>
                <td>
                  <LinkCells links={b.links ?? {}} />
                </td>
              </tr>
            ))}
            {draft.map((b) => (
              <tr key={b.id} className="fp-draft-row" title={b.notes}>
                <td className="mono fp-td-id">draft</td>
                <td>
                  <span className={`fp-sev fp-sev-${b.severity.toLowerCase()}`}>{b.severity}</span>
                </td>
                <td>
                  <span className="fp-bstatus">{b.status}</span>
                </td>
                <td>{b.title}</td>
                <td className="mono fp-td-cases">{b.caseIds.join(", ") || "—"}</td>
                <td>
                  <LinkCells links={b.links} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
