import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div style={{ opacity: 0.5 }}>{icon}</div>}
      <div style={{ fontWeight: 500, color: "var(--text-2)" }}>{title}</div>
      {hint && <div style={{ fontSize: "var(--fs-sm)" }}>{hint}</div>}
      {action}
    </div>
  );
}
