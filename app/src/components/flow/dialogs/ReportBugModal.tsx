// "Report bug" authoring dialog: files a draft bug against a page, with inline
// validation instead of alert().
import { useEffect, useState } from "react";
import { Modal } from "../../ui/Modal";
import { addDraftBug } from "../../../data/editsService";
import { SEVERITIES, type Severity } from "../../../lib/severity";
import type { NavNode } from "../../../types";
import { Field } from "./Field";

export function ReportBugModal({
  page,
  onClose,
  onSaved,
}: {
  page: NavNode | null;
  onClose: () => void;
  onSaved: (pageId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("S3");
  const [status, setStatus] = useState("Open");
  const [caseIds, setCaseIds] = useState("");
  const [linear, setLinear] = useState("");
  const [jam, setJam] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (page) setError(null);
  }, [page]);

  const save = () => {
    if (!page) return;
    const t = title.trim();
    if (!t) return setError("Bug title is required.");
    const urlOk = (v: string) => !v || /^https?:\/\//.test(v);
    if (!urlOk(linear.trim()) || !urlOk(jam.trim()))
      return setError("Links must start with http:// or https://.");
    addDraftBug({
      title: t,
      severity,
      status,
      pageId: page.id,
      caseIds: caseIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      links: {
        ...(linear.trim() && { linear: linear.trim() }),
        ...(jam.trim() && { jam: jam.trim() }),
      },
      notes: notes.trim(),
    });
    setTitle("");
    setCaseIds("");
    setLinear("");
    setJam("");
    setNotes("");
    onSaved(page.id);
  };

  return (
    <Modal open={page !== null} onClose={onClose} title={`Report bug — ${page?.label ?? ""}`}>
      <div className="fd-form">
        <Field label="Title *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <div className="fd-row">
          <Field label="Severity">
            <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {["Open", "In progress", "Fixed", "Closed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Linked test case IDs (comma-separated)">
          <input
            value={caseIds}
            onChange={(e) => setCaseIds(e.target.value)}
            placeholder="GEN-REG01, SUB-SAN02"
          />
        </Field>
        <div className="fd-row">
          <Field label="Linear link">
            <input
              value={linear}
              onChange={(e) => setLinear(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="JAM link">
            <input value={jam} onChange={(e) => setJam(e.target.value)} placeholder="https://…" />
          </Field>
        </div>
        <Field label="Repro notes">
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && (
          <p className="fd-error" role="alert">
            {error}
          </p>
        )}
        <div className="fd-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            File draft bug
          </button>
        </div>
      </div>
    </Modal>
  );
}
