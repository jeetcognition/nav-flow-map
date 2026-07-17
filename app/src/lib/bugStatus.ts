import type { BugStatus } from "../types";

export const BUG_STATUS_ORDER: BugStatus[] = ["open", "in-progress", "fixed", "verified", "closed"];

export const BUG_STATUS_LABEL: Record<BugStatus, string> = {
  open: "Open",
  "in-progress": "In Progress",
  fixed: "Fixed",
  verified: "Verified",
  closed: "Closed",
};

export const BUG_STATUS_COLOR: Record<BugStatus, string> = {
  open: "var(--danger)",
  "in-progress": "var(--warning)",
  fixed: "var(--info)",
  verified: "var(--accent)",
  closed: "var(--gray-strong)",
};
