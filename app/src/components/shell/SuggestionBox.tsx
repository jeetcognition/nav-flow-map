// App-improvement suggestion box. Submitting posts to the save worker's
// /suggest endpoint, which starts a Devin session that implements the
// suggestion on the repo and opens a PR for admin review.
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowSquareOut, Lightbulb, PaperPlaneTilt } from "@phosphor-icons/react";
import { Modal } from "../ui/Modal";
import { SAVE_ENDPOINT } from "../../lib/config";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; url?: string }
  | { kind: "error"; message: string };

export function SuggestionBox() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const location = useLocation();

  const close = () => {
    setOpen(false);
    setStatus({ kind: "idle" });
  };

  const submit = async () => {
    const suggestion = text.trim();
    if (suggestion.length < 10) {
      setStatus({ kind: "error", message: "Describe the suggestion in at least a sentence." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(`${SAVE_ENDPOINT}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion, context: `Submitted from page: ${location.pathname}` }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus({ kind: "done", url: data.url });
      setText("");
    } catch (err) {
      setStatus({
        kind: "error",
        message: `Could not start the session: ${err instanceof Error ? err.message : "network error"}`,
      });
    }
  };

  return (
    <>
      <button
        className="suggest-trigger"
        onClick={() => setOpen(true)}
        aria-label="Suggest an app improvement"
        title="Suggest an improvement — a Devin session implements it and opens a PR"
      >
        <Lightbulb size={15} weight="duotone" />
        <span>Suggest</span>
      </button>

      <Modal open={open} onClose={close} title="Suggest an improvement" width={520}>
        <div className="fd-form">
          <p className="fd-hint">
            Point out an issue, or suggest adding / editing / changing anything in this app. A Devin
            session will implement it on the repo and open a pull request; an admin reviews and
            merges it.
          </p>
          <label className="fd-field">
            <span className="fd-label">Your suggestion</span>
            <textarea
              rows={5}
              autoFocus
              value={text}
              placeholder="e.g. The Issues table should let me sort by severity…"
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          {status.kind === "error" && (
            <p className="fd-error" role="alert">
              {status.message}
            </p>
          )}
          {status.kind === "done" ? (
            <div className="suggest-done" role="status">
              <p>Session started — it will open a PR for admin review when the change is ready.</p>
              {status.url && (
                <a href={status.url} target="_blank" rel="noopener noreferrer">
                  Watch the session <ArrowSquareOut size={13} weight="duotone" />
                </a>
              )}
            </div>
          ) : (
            <div className="fd-actions">
              <button className="btn" onClick={close}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={status.kind === "sending"}
              >
                <PaperPlaneTilt size={14} weight="duotone" />
                {status.kind === "sending" ? "Starting session…" : "Submit suggestion"}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
