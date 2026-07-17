export type SurfaceId = "enterprise" | "retail" | "windsurf" | "devin-cli";

export interface Surface {
  id: SurfaceId;
  label: string;
  kind: "webapp" | "desktop" | "cli";
  status: "active" | "coming-soon";
  /** extra matrix dimensions supported later (e.g. retail browser/device) */
  dimensions?: string[];
}

export interface NavNode {
  id: string;
  label: string;
  group: "entry" | "suborg" | "personal" | "enterprise";
  route: string;
  desc: string;
  parent: string | null;
  via: string | null;
  prefixes: string[];
}

export type Suite = "Sanity" | "Regression" | "Draft";
export type AutomationStatus = "automated" | "manual" | "in-progress" | "not-automatable";

export interface TestCase {
  id: string;
  title: string;
  surfaceId: SurfaceId;
  nodeId: string;
  suite: Suite;
  priority: "P1" | "P2" | "P3";
  reach: string;
  steps: string;
  expected: string;
  automation: AutomationStatus;
  flaky: boolean;
  createdBy: string;
  source: "authored" | "ai-from-incident" | "ai-suggested";
}

export type BugStatus = "open" | "in-progress" | "fixed" | "verified" | "closed";

export interface Bug {
  id: string;
  title: string;
  severity: "S1" | "S2" | "S3" | "S4";
  status: BugStatus;
  surfaceId: SurfaceId;
  nodeId: string;
  caseIds: string[];
  links: { linear?: string; jam?: string; pr?: string };
  reproSteps: string;
  environment: "staging" | "beta";
  reporter: string;
  createdAt: string;
  incidentId: string | null;
}

export type RunTrigger = "manual" | "release" | "nightly" | "devin-session";
export type CaseResultStatus = "passed" | "failed" | "skipped";

export interface Run {
  id: string;
  surfaceId: SurfaceId;
  suite: Suite;
  env: "staging" | "beta";
  trigger: RunTrigger;
  triggeredBy: string;
  devinSessionId: string | null;
  startedAt: string;
  durationSec: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  status: "passed" | "failed" | "running";
}

export interface CaseResult {
  caseId: string;
  nodeId: string;
  status: CaseResultStatus;
  durationSec: number;
}

export type IncidentCategory = "app-bug" | "customer-doubt" | "config-issue" | "feature-request" | "unknown";

export interface Incident {
  id: string;
  source: "pylon" | "datadog";
  title: string;
  description: string;
  surfaceId: SurfaceId;
  nodeId: string;
  severity: "S1" | "S2" | "S3" | "S4";
  status: "open" | "investigating" | "resolved";
  customer: string;
  createdAt: string;
  ai: { category: IncidentCategory; confidence: number; rationale: string };
  humanCategory: IncidentCategory | null;
  overriddenBy: string | null;
  linkedBugId: string | null;
  linkedCaseId: string | null;
}

export interface User {
  id: string;
  name: string;
  role: "Admin" | "QA" | "Viewer";
  color: string;
  initials: string;
}

export type SessionStatus = "queued" | "running" | "done" | "failed";

export interface DevinSession {
  id: string;
  runId: string | null;
  surfaceId: SurfaceId;
  scope: string;
  status: SessionStatus;
  startedAt: string;
  url: string;
}

/** derived, computed by dataService */
export interface NodeStats {
  nodeId: string;
  total: number;
  automated: number;
  passing: number;   // cases passing in their most recent run appearance
  failing: number;
  openBugs: number;
  incidents: number;
  coverage: "covered" | "partial" | "uncovered";
}
