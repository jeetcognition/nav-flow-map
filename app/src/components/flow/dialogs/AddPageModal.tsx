// "+ Add page" authoring dialog: same validation as the legacy <dialog> form,
// with inline error messages instead of alert().
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../ui/Modal";
import { addPage, allPages } from "../../../data/editsService";
import { useEditsVersion } from "../../../hooks/useEdits";
import type { NavNode } from "../../../types";
import { Field } from "./Field";

const GROUPS: { id: NavNode["group"]; label: string }[] = [
  { id: "entry", label: "Entry" },
  { id: "suborg", label: "Sub-org" },
  { id: "personal", label: "Personal" },
  { id: "enterprise", label: "Enterprise" },
];

let addPageCounter = 0;

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
