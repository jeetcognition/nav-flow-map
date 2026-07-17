// "+ Add link" authoring dialog: connects two pages with a manual navigation
// edge, with inline validation instead of alert().
import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../ui/Modal";
import { addLink, allPages, extraLinks } from "../../../data/editsService";
import { useEditsVersion } from "../../../hooks/useEdits";
import { Field } from "./Field";

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
