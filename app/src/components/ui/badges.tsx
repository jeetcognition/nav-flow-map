import type {
  AutomationStatus,
  Bug,
  BugStatus,
  CaseResultStatus,
  IncidentCategory,
  SessionStatus,
  TestCase,
} from "../../types";
import { CATEGORY_META } from "../../lib/categoryMeta";
import type { Severity } from "../../lib/severity";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cls =
    severity === "S1"
      ? "badge-red"
      : severity === "S2"
        ? "badge-amber"
        : severity === "S3"
          ? "badge-blue"
          : "badge-gray";
  return <span className={`badge ${cls} mono`}>{severity}</span>;
}

export function PriorityBadge({ priority }: { priority: TestCase["priority"] }) {
  const cls = priority === "P1" ? "badge-red" : priority === "P2" ? "badge-amber" : "badge-gray";
  return <span className={`badge ${cls} mono`}>{priority}</span>;
}

export function EnvBadge({ env }: { env: Bug["environment"] }) {
  return (
    <span className={`badge ${env === "staging" ? "badge-blue" : "badge-purple"}`}>{env}</span>
  );
}

const BUG_STATUS: Record<BugStatus, [string, string]> = {
  open: ["Open", "badge-red"],
  "in-progress": ["In Progress", "badge-amber"],
  fixed: ["Fixed", "badge-blue"],
  verified: ["Verified", "badge-green"],
  closed: ["Closed", "badge-gray"],
};
export function BugStatusBadge({ status }: { status: BugStatus }) {
  const [label, cls] = BUG_STATUS[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

const RESULT: Record<CaseResultStatus, [string, string]> = {
  passed: ["Passed", "badge-green"],
  failed: ["Failed", "badge-red"],
  skipped: ["Skipped", "badge-gray"],
};
export function ResultBadge({ status }: { status: CaseResultStatus }) {
  const [label, cls] = RESULT[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

const AUTOMATION: Record<AutomationStatus, [string, string]> = {
  automated: ["Automated", "badge-green"],
  manual: ["Manual", "badge-blue"],
  "in-progress": ["In Progress", "badge-amber"],
  "not-automatable": ["Not Automatable", "badge-gray"],
};
export function AutomationBadge({ status }: { status: AutomationStatus }) {
  const [label, cls] = AUTOMATION[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function CategoryBadge({ category }: { category: IncidentCategory }) {
  const meta = CATEGORY_META[category];
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

const SESSION: Record<SessionStatus, [string, string]> = {
  queued: ["Queued", "badge-gray"],
  running: ["Running", "badge-amber"],
  done: ["Done", "badge-green"],
  failed: ["Failed", "badge-red"],
};
export function SessionBadge({ status }: { status: SessionStatus }) {
  const [label, cls] = SESSION[status];
  return (
    <span className={`badge ${cls}`}>
      {status === "running" && <span className="pulse-dot" aria-hidden />}
      {label}
    </span>
  );
}
