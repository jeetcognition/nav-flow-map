// Shared labeled-field wrapper for the NavFlow authoring dialogs.
import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="fd-field">
      <span className="fd-label">{label}</span>
      {children}
    </label>
  );
}
