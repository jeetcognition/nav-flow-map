// AI-assisted "Draft bug report" modal for the Bugs page.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CircleNotch, Sparkle, Warning } from "@phosphor-icons/react";
import { addBug, getNodes, newId } from "../../data/dataService";
import { draftBugFromNotes, findDuplicateBugs } from "../../data/aiService";
import { useApp } from "../../hooks/useApp";
import { Modal } from "../ui/Modal";
import { EASE } from "../../lib/motion";
import { SEVERITIES, type Severity } from "../../lib/severity";
import type { Bug } from "../../types";

interface DraftForm {
  title: string;
  severity: Bug["severity"];
  nodeId: string;
  environment: Bug["environment"];
  reproSteps: string;
  jam: string;
}

export function DraftBugModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
