// Single mock data layer. Swap this module's internals for real APIs later —
// UI components only ever import from here.
import nodesJson from "./fixtures/nodes.json";
import testcasesJson from "./fixtures/testcases.json";
import bugsJson from "./fixtures/bugs.json";
import runsJson from "./fixtures/runs.json";
import runResultsJson from "./fixtures/runResults.json";
import incidentsJson from "./fixtures/incidents.json";
import sessionsJson from "./fixtures/sessions.json";
import { SURFACES, USERS } from "./fixtures/static";
import { devinSessionUrl } from "../lib/config";
import type {
  Bug,
  CaseResult,
  DevinSession,
  Incident,
  IncidentCategory,
  NavNode,
  NodeStats,
  Run,
  SessionStatus,
  Surface,
  SurfaceId,
  TestCase,
  User,
} from "../types";

type Listener = () => void;

const store = {
  nodes: nodesJson as NavNode[],
  testcases: [...(testcasesJson as TestCase[])],
  bugs: [...(bugsJson as Bug[])],
  runs: [...(runsJson as Run[])],
  runResults: { ...(runResultsJson as Record<string, CaseResult[]>) },
  incidents: [...(incidentsJson as Incident[])],
  sessions: [...(sessionsJson as DevinSession[])],
};

const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

/** subscribe to any mutation; returns unsubscribe */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---- reads ----
export const getSurfaces = (): Surface[] => SURFACES;
export const getUsers = (): User[] => USERS;
export const getUser = (id: string): User | undefined => USERS.find((u) => u.id === id);
export const getNodes = (): NavNode[] => store.nodes;
export const getNode = (id: string): NavNode | undefined => store.nodes.find((n) => n.id === id);
export const getTestCases = (): TestCase[] => store.testcases;
export const getTestCase = (id: string): TestCase | undefined =>
  store.testcases.find((c) => c.id === id);
export const getBugs = (): Bug[] => store.bugs;
export const getBug = (id: string): Bug | undefined => store.bugs.find((b) => b.id === id);
export const getRuns = (): Run[] => store.runs;
export const getRun = (id: string): Run | undefined => store.runs.find((r) => r.id === id);
export const getRunResults = (runId: string): CaseResult[] => store.runResults[runId] ?? [];
export const getIncidents = (): Incident[] => store.incidents;
export const getIncident = (id: string): Incident | undefined =>
  store.incidents.find((i) => i.id === id);
export const getSessions = (): DevinSession[] => store.sessions;

export const incidentCategory = (i: Incident): IncidentCategory => i.humanCategory ?? i.ai.category;

/** Display name for a user id; falls back to the raw id (e.g. "scheduler"). */
export const userName = (id: string): string => getUser(id)?.name ?? id;

/** Unique entity id: lowest free `${prefix}-NNN` across all stores. */
export function newId(prefix: string): string {
  const exists = (id: string) =>
    store.testcases.some((c) => c.id === id) ||
    store.bugs.some((b) => b.id === id) ||
    store.incidents.some((i) => i.id === id) ||
    store.sessions.some((s) => s.id === id);
  for (let n = 1; ; n++) {
    const candidate = `${prefix}-${String(n).padStart(3, "0")}`;
    if (!exists(candidate)) return candidate;
  }
}

/** Single risk formula shared by the graph Risk view and AI reports. */
export const nodeRisk = (s: NodeStats): number => s.openBugs * 3 + s.incidents * 2;

// ---- derived stats ----
/** latest result per case across run history */
function latestResults(): Map<string, CaseResult> {
  const map = new Map<string, CaseResult>();
  const chronological = [...store.runs].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  for (const run of chronological) {
    for (const r of store.runResults[run.id] ?? []) map.set(r.caseId, r);
  }
  return map;
}

export function nodeStats(nodeId: string): NodeStats {
  const cases = store.testcases.filter((c) => c.nodeId === nodeId);
  const latest = latestResults();
  let passing = 0,
    failing = 0;
  for (const c of cases) {
    const r = latest.get(c.id);
    if (r?.status === "passed") passing++;
    else if (r?.status === "failed") failing++;
  }
  const automated = cases.filter((c) => c.automation === "automated").length;
  const openBugs = store.bugs.filter(
    (b) => b.nodeId === nodeId && b.status !== "closed" && b.status !== "verified",
  ).length;
  const incidents = store.incidents.filter(
    (i) => i.nodeId === nodeId && i.status !== "resolved",
  ).length;
  const ratio = cases.length ? automated / cases.length : 0;
  return {
    nodeId,
    total: cases.length,
    automated,
    passing,
    failing,
    openBugs,
    incidents,
    coverage: cases.length === 0 ? "uncovered" : ratio >= 0.6 ? "covered" : "partial",
  };
}

export function surfaceStats(surfaceId: SurfaceId) {
  const cases = store.testcases.filter((c) => c.surfaceId === surfaceId);
  const automated = cases.filter((c) => c.automation === "automated").length;
  const nodes = store.nodes;
  const covered = nodes.filter((n) => nodeStats(n.id).coverage === "covered").length;
  return {
    totalCases: cases.length,
    automated,
    automatedPct: cases.length ? Math.round((automated / cases.length) * 100) : 0,
    coveredPct: nodes.length ? Math.round((covered / nodes.length) * 100) : 0,
    nodes: nodes.length,
  };
}

/** incidents that were real bugs with no pre-existing testcase */
export function escapedDefects(): Incident[] {
  return store.incidents.filter((i) => incidentCategory(i) === "app-bug" && !i.linkedCaseId);
}

// ---- mutations ----
export function overrideIncidentCategory(id: string, category: IncidentCategory, userId: string) {
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) return;
  inc.humanCategory = category;
  inc.overriddenBy = userId;
  notify();
}

export function addTestCase(tc: TestCase) {
  store.testcases.push(tc);
  notify();
}

export function linkIncidentToCase(incidentId: string, caseId: string) {
  const inc = store.incidents.find((i) => i.id === incidentId);
  if (inc) {
    inc.linkedCaseId = caseId;
    notify();
  }
}

export function updateBugStatus(id: string, status: Bug["status"]) {
  const bug = store.bugs.find((b) => b.id === id);
  if (bug) {
    bug.status = status;
    notify();
  }
}

export function addBug(bug: Bug) {
  store.bugs.push(bug);
  notify();
}

let sessionCounter = 100;
/** mock Devin session: queued → running → done with simulated progress */
export function triggerDevinSession(scope: string, surfaceId: SurfaceId): DevinSession {
  const id = `dvn-live-${++sessionCounter}`;
  const session: DevinSession = {
    id,
    runId: null,
    surfaceId,
    scope,
    status: "queued",
    startedAt: new Date().toISOString(),
    url: devinSessionUrl(id),
  };
  store.sessions.unshift(session);
  notify();
  const advance = (status: SessionStatus, delay: number) =>
    setTimeout(() => {
      session.status = status;
      notify();
    }, delay);
  advance("running", 2500);
  advance("done", 11000);
  return session;
}
