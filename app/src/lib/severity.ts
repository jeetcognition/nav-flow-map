export const SEVERITIES = ["S1", "S2", "S3", "S4"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_COLOR: Record<Severity, string> = {
  S1: "var(--danger)",
  S2: "var(--warning)",
  S3: "var(--info)",
  S4: "var(--gray-strong)",
};
