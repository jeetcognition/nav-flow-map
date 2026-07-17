// Converts legacy data (testcases.js, bugs.js) into typed JSON fixtures and
// generates deterministic seed data for runs, incidents, and Devin sessions.
// Run: node scripts/seed.mjs   (from app/)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const out = join(here, "..", "src", "data", "fixtures");
mkdirSync(out, { recursive: true });

// deterministic hash → [0,1)
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
};
const pick = (arr, seed) => arr[Math.floor(hash(seed) * arr.length)];

const nodes = JSON.parse(readFileSync(join(out, "nodes.json"), "utf8"));
const prefixToNode = {};
for (const n of nodes) for (const p of n.prefixes) prefixToNode[p] = n.id;

const evalConst = (file, name) =>
  new Function(`${readFileSync(file, "utf8")}; return ${name};`)();

// ---- testcases ----
const legacyCases = evalConst(join(repo, "testcases.js"), "TESTCASES");
const SUITE_MAP = { Smoke: "Sanity", Sanity: "Sanity", Regression: "Regression", E2E: "Regression", Draft: "Draft" };
const nodeFor = (id) => {
  const parts = id.split("-");
  for (let i = parts.length - 1; i > 0; i--) {
    const prefix = parts.slice(0, i).join("-");
    if (prefixToNode[prefix]) return prefixToNode[prefix];
  }
  return null;
};
const AUTO_STATUSES = ["automated", "automated", "automated", "manual", "manual", "in-progress", "not-automatable"];
const USERS = ["u-jeet", "u-maya", "u-arjun", "u-priya"];

const testcases = legacyCases.map((c) => {
  const nodeId = nodeFor(c.id);
  const automation = pick(AUTO_STATUSES, c.id + "auto");
  return {
    id: c.id,
    title: c.steps.length > 90 ? c.steps.slice(0, 87) + "…" : c.steps,
    surfaceId: "enterprise",
    nodeId,
    suite: SUITE_MAP[c.type] || "Draft",
    priority: c.pri,
    reach: c.reach,
    steps: c.steps,
    expected: c.expected,
    automation,
    flaky: automation === "automated" && hash(c.id + "flaky") < 0.08,
    createdBy: pick(USERS, c.id + "owner"),
    source: "authored",
  };
}).filter((c) => c.nodeId);
writeFileSync(join(out, "testcases.json"), JSON.stringify(testcases, null, 1));

// ---- bugs (legacy, enriched) ----
const legacyBugs = evalConst(join(repo, "bugs.js"), "BUGS");
const BUG_STATUS = { Open: "open", "In Progress": "in-progress", Fixed: "fixed", Verified: "verified", Closed: "closed" };
const bugs = legacyBugs.map((b, i) => ({
  id: b.id,
  title: b.title,
  severity: b.severity,
  status: BUG_STATUS[b.status] || "open",
  surfaceId: "enterprise",
  nodeId: b.pageId,
  caseIds: b.caseIds || [],
  links: b.links || {},
  reproSteps: b.notes || "",
  environment: pick(["staging", "beta"], b.id),
  reporter: pick(USERS, b.id),
  createdAt: new Date(Date.UTC(2026, 5, 2 + i * 3, 9 + (i % 8))).toISOString(),
  incidentId: null,
}));
writeFileSync(join(out, "bugs.json"), JSON.stringify(bugs, null, 1));

// ---- runs ----
const suites = ["Sanity", "Regression"];
const TRIGGERS = ["manual", "release", "nightly", "devin-session"];
const runs = [];
const runResults = {};
for (let i = 0; i < 12; i++) {
  const id = `RUN-${1040 - i * 7}`;
  const suite = suites[i % 2];
  const pool = testcases.filter((c) => c.suite === suite && c.automation === "automated");
  const cases = pool.filter((c) => hash(id + c.id) < 0.55);
  const results = cases.map((c) => {
    const failBias = c.flaky ? 0.35 : 0.1;
    const status = hash(id + c.id + "res") < failBias ? "failed" : (hash(id + c.id + "skip") < 0.04 ? "skipped" : "passed");
    return { caseId: c.id, nodeId: c.nodeId, status, durationSec: Math.round(20 + hash(id + c.id + "dur") * 220) };
  });
  const failed = results.filter((r) => r.status === "failed").length;
  const passed = results.filter((r) => r.status === "passed").length;
  const skipped = results.length - failed - passed;
  const start = Date.UTC(2026, 6, 16 - i, 2 + Math.floor(hash(id) * 14), Math.floor(hash(id + "m") * 60));
  runs.push({
    id,
    surfaceId: "enterprise",
    suite,
    env: i % 3 === 0 ? "beta" : "staging",
    trigger: TRIGGERS[i % 4],
    triggeredBy: TRIGGERS[i % 4] === "nightly" ? "scheduler" : pick(USERS, id),
    devinSessionId: TRIGGERS[i % 4] === "devin-session" || i % 2 === 0 ? `dvn-${id.toLowerCase()}` : null,
    startedAt: new Date(start).toISOString(),
    durationSec: results.reduce((a, r) => a + r.durationSec, 0),
    total: results.length, passed, failed, skipped,
    status: failed > 0 ? "failed" : "passed",
  });
  runResults[id] = results;
}
writeFileSync(join(out, "runs.json"), JSON.stringify(runs, null, 1));
writeFileSync(join(out, "runResults.json"), JSON.stringify(runResults, null, 1));

// ---- incidents (mock Pylon + Datadog) ----
const CATEGORIES = ["app-bug", "customer-doubt", "config-issue", "feature-request", "unknown"];

const INCIDENT_SEEDS = [
  ["Cannot log in after SSO enforcement enabled", "login", "app-bug", "S1", "Customer's whole org locked out after enabling Require SSO; OTP fallback also failing."],
  ["OTP email arrives after 10+ minutes", "auth", "app-bug", "S2", "Multiple users report one-time codes arriving too late to use; resend loops."],
  ["How do I add a new sub-organization?", "e-orgs", "customer-doubt", "S4", "Admin asking where the create org flow lives; found Membership but not Organizations."],
  ["Session list not loading — spinner forever", "e-sessions", "app-bug", "S2", "Enterprise sessions page hangs on load for orgs with 5k+ sessions; console shows 504s."],
  ["Devin model picker reverts to Lite", "e-devin", "app-bug", "S2", "Setting Ultra and saving reverts on reload. Matches internal BUG-015 signature."],
  ["Request: dark mode for Analytics exports", "e-analytics", "feature-request", "S4", "Customer wants PDF exports of usage analytics with dark theme branding."],
  ["Webhook secret rotation unclear", "s-secrets", "customer-doubt", "S3", "Customer asking whether rotating an org secret invalidates running sessions."],
  ["GitHub app disconnects nightly", "e-conn", "config-issue", "S2", "Datadog monitor: github connection health check flapping every night 02:00 UTC."],
  ["Guardrail violations page 500s for auditor role", "e-guardrails", "app-bug", "S2", "Users with auditor-scoped role get server error opening violations tab."],
  ["Repo access revoked but sessions still start", "e-repos", "app-bug", "S1", "Security-sensitive: removed repo permission still usable in new composer sessions for ~1h."],
  ["Playbook editor loses unsaved changes", "e-playbooks", "app-bug", "S3", "Switching tabs mid-edit silently drops playbook draft content."],
  ["Can we bulk-invite members via CSV?", "e-membership", "feature-request", "S4", "Enterprise admin wants CSV import; currently inviting 200 members one by one."],
  ["Environment blueprint stuck in Provisioning", "e-env", "config-issue", "S2", "Datadog: blueprint provisioning exceeds 30m for eu-west tenants."],
  ["Wiki page renders raw HTML", "wiki", "app-bug", "S3", "Repo wiki pages with embedded HTML show escaped markup instead of content."],
  ["Review comments posted to wrong PR", "review", "app-bug", "S1", "Devin Review posted comments on an unrelated open PR in the same repo."],
  ["Where to find personal API usage?", "my-analytics", "customer-doubt", "S4", "User can't find per-user consumption; pointed to My Analytics."],
  ["Code scan profile can't exclude vendored dirs", "security", "feature-request", "S3", "Wants glob-based exclusions for /vendor and generated code in scan profiles."],
  ["Infra capacity alert: hypervisor pool 92%", "e-infra", "config-issue", "S2", "Datadog monitor breach on tenant capacity; needs rebalancing runbook."],
  ["Automation schedule fires twice", "automations", "app-bug", "S2", "Legacy schedule + new automation both trigger the same nightly job."],
  ["Composer repo selector missing new repos", "composer", "app-bug", "S3", "Repos granted today don't appear until logout/login; cache suspected."],
  ["Skills usage drill-down shows 0 sessions", "e-skills", "app-bug", "S3", "Skill usage counts populated but session drill-down list always empty."],
  ["Clarify ACU limits for sub-orgs", "org-create", "customer-doubt", "S4", "Customer confused whether ACU limit is monthly or total."],
  ["IdP group mapping drops nested groups", "groups-idp", "config-issue", "S2", "Okta nested groups not flattened; members lose role mapping on sync."],
  ["Support page contact form times out", "support", "app-bug", "S3", "Submitting the support form intermittently 408s; retry succeeds."],
  ["Analytics category totals don't match org sum", "e-analytics", "unknown", "S3", "Category view total differs from per-org sums by ~4%; unclear if rounding or bug."],
];
const incidents = INCIDENT_SEEDS.map(([title, nodeId, cat, sev, desc], i) => {
  const conf = cat === "unknown" ? 0.42 + hash(title) * 0.2 : 0.68 + hash(title) * 0.3;
  const overridden = hash(title + "ovr") < 0.16;
  const created = Date.UTC(2026, 5, 18 + Math.floor(i * 1.15), 6 + (i % 12), Math.floor(hash(title + "m") * 60));
  return {
    id: `INC-${2300 + i * 3}`,
    source: i % 3 === 2 ? "datadog" : "pylon",
    title,
    description: desc,
    surfaceId: "enterprise",
    nodeId,
    severity: sev,
    status: pick(["open", "open", "investigating", "resolved"], title),
    customer: `Customer ${String.fromCharCode(65 + (i % 9))}•••`,
    createdAt: new Date(created).toISOString(),
    ai: {
      category: cat,
      confidence: Math.round(Math.min(conf, 0.97) * 100) / 100,
      rationale: `Classified from title/description signals${cat === "app-bug" ? ": reproducible product behavior mismatch" : cat === "customer-doubt" ? ": informational question, no defect signal" : cat === "config-issue" ? ": environment/monitor origin, not app code" : cat === "feature-request" ? ": request for new capability" : ": ambiguous signals, needs human review"}.`,
    },
    humanCategory: overridden ? pick(CATEGORIES, title + "h") : null,
    overriddenBy: overridden ? pick(USERS, title + "u") : null,
    linkedBugId: null,
    linkedCaseId: null,
  };
});
// traceability: link a few app-bug incidents to existing bugs/cases
incidents[4].linkedBugId = "BUG-015";
incidents[4].status = "investigating";
const linkable = incidents.filter((x) => x.ai.category === "app-bug").slice(0, 5);
for (const inc of linkable) {
  const tc = testcases.find((c) => c.nodeId === inc.nodeId);
  if (tc) inc.linkedCaseId = tc.id;
}
writeFileSync(join(out, "incidents.json"), JSON.stringify(incidents, null, 1));

// ---- devin sessions ----
const sessions = runs.filter((r) => r.devinSessionId).map((r) => ({
  id: r.devinSessionId,
  runId: r.id,
  surfaceId: "enterprise",
  scope: `${r.suite} suite`,
  status: "done",
  startedAt: r.startedAt,
  url: `https://app.devin.ai/sessions/${r.devinSessionId}`,
}));
writeFileSync(join(out, "sessions.json"), JSON.stringify(sessions, null, 1));

console.log(`testcases: ${testcases.length}, bugs: ${bugs.length}, runs: ${runs.length}, incidents: ${incidents.length}, sessions: ${sessions.length}`);
