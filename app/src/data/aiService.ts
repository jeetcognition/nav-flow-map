// All AI features route through here. Phase 1: canned mock responses behind
// simulated latency (AI_MOCK). Swap `mockDelay` bodies for Anthropic API calls later.
// Every output is a *draft* — UI must let the human edit before saving.
import {
  getBugs,
  getRun,
  getRunResults,
  getTestCases,
  getNode,
  nodeRisk,
  nodeStats,
} from "./dataService";
import type { Incident, TestCase } from "../types";

export const AI_MOCK = true;

const mockDelay = <T>(value: T, ms = 900): Promise<T> =>
  new Promise((res) => setTimeout(() => res(value), ms));

export interface DraftTestCase {
  title: string;
  nodeId: string;
  priority: "P1" | "P2" | "P3";
  preconditions: string;
  steps: string;
  expected: string;
}

export function draftTestCaseFromIncident(incident: Incident): Promise<DraftTestCase> {
  const node = getNode(incident.nodeId);
  return mockDelay(
    {
      title: `Regression: ${incident.title}`,
      nodeId: incident.nodeId,
      priority: incident.severity === "S1" ? "P1" : incident.severity === "S2" ? "P1" : "P2",
      preconditions: `Signed in with an account matching the affected customer profile. Navigate: ${node?.via ?? node?.route ?? "surface root"}.`,
      steps: `Reproduce the reported scenario: ${incident.description}`,
      expected: `The reported failure no longer occurs; behavior matches spec and no console/network errors are logged.`,
    },
    1200,
  );
}

export function suggestMissingCases(nodeId: string): Promise<string[]> {
  const node = getNode(nodeId);
  const existing = getTestCases().filter((c) => c.nodeId === nodeId);
  const label = node?.label ?? nodeId;
  const themes = [
    `Keyboard-only navigation through ${label} (tab order, focus states, Escape behavior)`,
    `${label} under slow network — loading skeletons, timeout messaging, retry path`,
    `Permission matrix: Viewer vs QA vs Admin access to ${label}`,
    `${label} state persistence across reload and browser back/forward`,
    `Concurrent edits to ${label} from two sessions — last-write behavior surfaced to user`,
  ];
  // pretend the model looked at existing coverage
  const count = existing.length > 15 ? 3 : 5;
  return mockDelay(themes.slice(0, count), 1100);
}

export interface RunSummary {
  headline: string;
  clusters: { cause: string; caseIds: string[] }[];
  flaky: string[];
}

export function summarizeRun(runId: string): Promise<RunSummary> {
  const run = getRun(runId);
  const results = getRunResults(runId);
  const failed = results.filter((r) => r.status === "failed");
  const byNode = new Map<string, string[]>();
  for (const f of failed) byNode.set(f.nodeId, [...(byNode.get(f.nodeId) ?? []), f.caseId]);
  const clusters = [...byNode.entries()].map(([nodeId, caseIds]) => ({
    cause: `Failures concentrated in ${getNode(nodeId)?.label ?? nodeId} — likely a shared regression in that flow`,
    caseIds,
  }));
  const flaky = failed
    .filter((f) => getTestCases().find((c) => c.id === f.caseId)?.flaky)
    .map((f) => f.caseId);
  const headline =
    failed.length === 0
      ? `All ${run?.total ?? 0} cases passed. No action needed.`
      : `${failed.length} failure${failed.length > 1 ? "s" : ""} across ${byNode.size} flow${byNode.size > 1 ? "s" : ""}${flaky.length ? `; ${flaky.length} match known-flaky signatures` : ""}.`;
  return mockDelay({ headline, clusters, flaky }, 1000);
}

export function findDuplicateBugs(
  title: string,
): Promise<{ id: string; title: string; score: number }[]> {
  const words = new Set(
    title
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3),
  );
  const scored = getBugs()
    .map((b) => {
      const bw = b.title.toLowerCase().split(/\W+/);
      const overlap = bw.filter((w) => words.has(w)).length;
      return { id: b.id, title: b.title, score: Math.min(0.95, overlap / Math.max(4, words.size)) };
    })
    .filter((s) => s.score > 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return mockDelay(scored, 800);
}

export interface DraftBug {
  title: string;
  reproSteps: string;
  expected: string;
  actual: string;
  severity: "S1" | "S2" | "S3" | "S4";
}

export function draftBugFromNotes(notes: string): Promise<DraftBug> {
  const firstLine = (notes.split(/[.\n]/)[0] ?? "").trim();
  return mockDelay(
    {
      title: firstLine.length > 8 ? firstLine : "Unexpected behavior observed",
      reproSteps: `1. Navigate to the affected page\n2. ${notes.trim()}\n3. Observe the result`,
      expected: "The action completes successfully with correct state persisted.",
      actual: firstLine,
      severity: /crash|lock|blocked|cannot|500|fail/i.test(notes) ? "S2" : "S3",
    },
    1100,
  );
}

export interface CoverageGap {
  nodeId: string;
  label: string;
  risk: number;
  reason: string;
}

export function coverageGapReport(): Promise<CoverageGap[]> {
  const nodeIds = new Set(getTestCases().map((c) => c.nodeId));
  const gaps: CoverageGap[] = [];
  for (const nodeId of nodeIds) {
    const stats = nodeStats(nodeId);
    if (stats.total === 0) continue;
    const autoRatio = stats.automated / stats.total;
    // shared base risk (same formula as the graph Risk view) + automation-gap weight
    const risk = nodeRisk(stats) + (1 - autoRatio) * 4;
    if (risk > 3) {
      const node = getNode(nodeId);
      gaps.push({
        nodeId,
        label: node?.label ?? nodeId,
        risk: Math.round(risk * 10) / 10,
        reason: `${stats.openBugs} open bug${stats.openBugs === 1 ? "" : "s"}, ${stats.incidents} incident${stats.incidents === 1 ? "" : "s"}, ${Math.round(autoRatio * 100)}% automated`,
      });
    }
  }
  return mockDelay(gaps.sort((a, b) => b.risk - a.risk).slice(0, 8), 1300);
}

export function automationCandidates(): Promise<TestCase[]> {
  const candidates = getTestCases()
    .filter((c) => c.automation === "manual" && c.priority === "P1" && c.suite !== "Draft")
    .slice(0, 6);
  return mockDelay(candidates, 900);
}
