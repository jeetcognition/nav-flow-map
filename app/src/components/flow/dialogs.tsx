// Authoring dialogs ported from the legacy app's <dialog> forms, with the
// same validation rules but inline error messages instead of alert().
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { addDraftBug, addLink, addPage, allPages, extraLinks } from "../../data/editsService";
import { useEditsVersion } from "../../hooks/useEdits";
import { SEVERITIES, type Severity } from "../../lib/severity";
import type { NavNode } from "../../types";

const GROUPS: { id: NavNode["group"]; label: string }[] = [
  { id: "entry", label: "Entry" },
  { id: "suborg", label: "Sub-org" },
  { id: "personal", label: "Personal" },
  { id: "enterprise", label: "Enterprise" },
];

let addPageCounter = 0;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="fd-field">
      <span className="fd-label">{label}</span>
      {children}
    </label>
  );
}

// ---- + Add page ----
export function AddPageModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (id: string) => void;
}) {
  const editsVersion = useEditsVersion();
  const pages = useMemo(
    () => allPages(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editsVersion, open],
  );
  const [label, setLabel] = useState("");
  const [route, setRoute] = useState("");
  const [group, setGroup] = useState<NavNode["group"]>("enterprise");
  const [parent, setParent] = useState("ent");
  const [via, setVia] = useState("");
  const [desc, setDesc] = useState("");
  const [drafts, setDrafts] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setParent(pages.some((p) => p.id === "ent") ? "ent" : (pages[0]?.id ?? ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    const name = label.trim();
    if (!name) return setError("Page name is required.");
    if (pages.some((p) => p.label.trim().toLowerCase() === name.toLowerCase()))
      return setError(`A page named "${name}" already exists — pick a different name.`);
    const routeVal = route.trim();
    const clash =
      routeVal &&
      pages.find((p) => String(p.route).trim().toLowerCase() === routeVal.toLowerCase());
    if (clash) return setError(`The page "${clash.label}" already has this route.`);
    if (!pages.some((p) => p.id === parent)) return setError("Pick a valid parent page.");

    const id = `user-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${++addPageCounter}-${pages.length}`;
    addPage(
      {
        id,
        label: name,
        group,
        route: routeVal || "(route TBD)",
        desc: desc.trim() || "User-added page.",
        parent,
        via: via.trim() || "Navigate from parent",
        prefixes: [],
      },
      drafts
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    setLabel("");
    setRoute("");
    setVia("");
    setDesc("");
    setDrafts("");
    onAdded(id);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add page">
      <div className="fd-form">
        <Field label="Page name *">
          <input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
        </Field>
        <div className="fd-row">
          <Field label="Group">
            <select value={group} onChange={(e) => setGroup(e.target.value as NavNode["group"])}>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Parent page">
            <select value={parent} onChange={(e) => setParent(e.target.value)}>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Route / URL">
          <input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="/org/…" />
        </Field>
        <Field label="How to navigate from parent">
          <input value={via} onChange={(e) => setVia(e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
        <Field label="Draft test cases (one per line — AI rewrites them on promotion)">
          <textarea rows={3} value={drafts} onChange={(e) => setDrafts(e.target.value)} />
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
            Add page
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---- + Add link ----
export function AddLinkModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (targetId: string) => void;
}) {
  const editsVersion = useEditsVersion();
  const pages = useMemo(
    () => allPages(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editsVersion, open],
  );
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [via, setVia] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSource(pages[0]?.id ?? "");
      setTarget(pages[1]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    if (source === target) return setError("Source and target must be different pages.");
    if (pages.some((p) => p.id === target && p.parent === source))
      return setError("That link already exists as the page's main parent link.");
    if (pages.some((p) => p.id === source && p.parent === target))
      return setError("That link is the reverse of the page's main parent link.");
    const existing = extraLinks();
    if (existing.some((l) => l.source === source && l.target === target))
      return setError("That link already exists.");
    if (existing.some((l) => l.source === target && l.target === source))
      return setError("The reverse of that link already exists.");
    addLink({ source, target, via: via.trim() || "Navigate directly" });
    setVia("");
    onAdded(target);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add navigation link">
      <div className="fd-form">
        <p className="fd-hint">
          Connect two pages when one is reachable another way — drawn as a dashed purple arrow; the
          main tree layout is unaffected.
        </p>
        <div className="fd-row">
          <Field label="From page">
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="To page">
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="How to navigate">
          <input
            value={via}
            onChange={(e) => setVia(e.target.value)}
            placeholder="e.g. Click the settings icon in the top bar"
          />
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
            Add link
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---- + Report bug ----
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
