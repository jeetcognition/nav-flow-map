import { useEffect, useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { Modal } from "../ui/Modal";
import { SkeletonLines } from "../ui/SkeletonLines";
import { addTestCase, getNodes, linkIncidentToCase, newId } from "../../data/dataService";
import { draftTestCaseFromIncident } from "../../data/aiService";
import { useApp } from "../../hooks/useApp";
import type { Incident, TestCase } from "../../types";
import "../../styles/incidents.css";

interface FormState {
  title: string;
  nodeId: string;
  priority: TestCase["priority"];
  preconditions: string;
  steps: string;
  expected: string;
}

interface Props {
  /** the incident to draft from; null keeps the modal closed */
  incident: Incident | null;
  onClose: () => void;
}

/**
 * AI-drafted testcase modal. Opens with a skeleton while the draft resolves,
 * then presents a fully editable form. Never auto-saves.
 */
export function CreateTestcaseModal({ incident, onClose }: Props) {
  const { user } = useApp();
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    setForm(null);
    if (!incident) return;
    let alive = true;
    draftTestCaseFromIncident(incident).then((draft) => {
      if (!alive) return;
      setForm({
        title: draft.title,
        nodeId: draft.nodeId,
        priority: draft.priority,
        preconditions: draft.preconditions,
        steps: draft.steps,
        expected: draft.expected,
      });
    });
    return () => {
      alive = false;
    };
  }, [incident]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = () => {
    if (!incident || !form || !form.title.trim()) return;
    const caseId = newId("INC2TC");
    addTestCase({
      id: caseId,
      title: form.title.trim(),
      surfaceId: "enterprise",
      nodeId: form.nodeId,
      suite: "Regression",
      priority: form.priority,
      reach: form.preconditions,
      steps: form.steps,
      expected: form.expected,
      automation: "manual",
      flaky: false,
      createdBy: user.id,
      source: "ai-from-incident",
    });
    linkIncidentToCase(incident.id, caseId);
    onClose();
  };

  return (
    <Modal open={!!incident} onClose={onClose} title="Create testcase from incident" width={640}>
      <div className="ai-note">
        <Sparkle size={16} weight="duotone" />
        AI draft — review before saving
      </div>

      {!form ? (
        <SkeletonLines lines={5} />
      ) : (
        <div className="tc-form">
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Testcase title"
            />
          </label>
          <div className="tc-form-row">
            <label>
              Node
              <select value={form.nodeId} onChange={(e) => set("nodeId", e.target.value)}>
                {getNodes().map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as TestCase["priority"])}
              >
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
            </label>
          </div>
          <label>
            Preconditions
            <textarea
              value={form.preconditions}
              onChange={(e) => set("preconditions", e.target.value)}
            />
          </label>
          <label>
            Steps
            <textarea value={form.steps} onChange={(e) => set("steps", e.target.value)} />
          </label>
          <label>
            Expected result
            <textarea value={form.expected} onChange={(e) => set("expected", e.target.value)} />
          </label>
          <div className="tc-form-actions">
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-ai" onClick={save} disabled={!form.title.trim()}>
              <Sparkle size={14} weight="duotone" />
              Save testcase
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
