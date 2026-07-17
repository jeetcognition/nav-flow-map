import type { IncidentCategory } from "../types";

export const CATEGORIES: IncidentCategory[] = [
  "app-bug",
  "customer-doubt",
  "config-issue",
  "feature-request",
  "unknown",
];

export const CATEGORY_META: Record<
  IncidentCategory,
  { label: string; cls: string; color: string }
> = {
  "app-bug": { label: "App Bug", cls: "badge-red", color: "var(--danger)" },
  "customer-doubt": { label: "Customer Doubt", cls: "badge-blue", color: "var(--info)" },
  "config-issue": { label: "Config Issue", cls: "badge-amber", color: "var(--warning)" },
  "feature-request": { label: "Feature Request", cls: "badge-purple", color: "var(--ai)" },
  unknown: { label: "Needs Review", cls: "badge-gray", color: "var(--text-3)" },
};
