// Wire layer for human verdicts (QA-DEC-028). dataService mutations enqueue
// here; entries are batched (debounced), POSTed to the save worker — which
// merges them into the committed pipeline ledgers — and survive reloads via
// localStorage. The payload shape is a wire contract with worker/worker.js
// (`/verdicts`) — do not rename its keys.
import { readStorage, writeStorage } from "../lib/storage";
import { COVERAGE_JSON_URL, PENDING_VERDICTS_URL, VERDICTS_ENDPOINT } from "../lib/config";
import type { IncidentCategory, PatternCoverage } from "../types";

const QUEUE_KEY = "qa-verdict-queue-v1";
const FLUSH_DELAY_MS = 1500;

const COVERAGE_STATUSES: PatternCoverage[] = ["uncovered", "weak", "covered", "dismissed"];
const TICKET_CATEGORIES: IncidentCategory[] = [
  "app-bug",
  "customer-doubt",
  "config-issue",
  "feature-request",
  "unknown",
];

export interface CoverageVerdict {
  status: PatternCoverage;
  coveredBy: string | null;
  by: string;
}

export interface TicketVerdict {
  category: IncidentCategory;
  by: string;
}

interface Queue {
  coverage: Record<string, CoverageVerdict>;
  tickets: Record<string, TicketVerdict>;
}

export interface VerdictSyncState {
  /** verdicts waiting to be saved (including the in-flight batch) */
  pending: number;
  syncing: boolean;
  error: string | null;
}

function loadQueue(): Queue {
  try {
    const raw = readStorage(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Queue>) : {};
    return { coverage: parsed.coverage ?? {}, tickets: parsed.tickets ?? {} };
  } catch {
    return { coverage: {}, tickets: {} };
  }
}

let queue: Queue = loadQueue();
let state: VerdictSyncState = { pending: queueSize(), syncing: false, error: null };
let timer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

const listeners = new Set<() => void>();

function queueSize(): number {
  return Object.keys(queue.coverage).length + Object.keys(queue.tickets).length;
}

function setState(patch: Partial<VerdictSyncState>) {
  state = { ...state, pending: queueSize(), ...patch };
  listeners.forEach((l) => l());
}

function persistQueue() {
  writeStorage(QUEUE_KEY, JSON.stringify(queue));
}

export function subscribeVerdictSync(fn: () => void): () => void {
  listeners.add(fn);
  // verdicts queued in a previous visit (e.g. reload after a failed save)
  // start flushing as soon as any verdict-aware UI mounts
  if (!initialized) {
    initialized = true;
    if (queueSize() > 0) scheduleFlush();
  }
  return () => listeners.delete(fn);
}

export const getVerdictSyncState = (): VerdictSyncState => state;

/** The UI's "PAT-<hex>" → the ledger's bare pattern id. */
const patternKey = (patternId: string) => patternId.replace(/^PAT-/, "");
/** The UI's "INC-<number>" → the Pylon ticket number. */
const ticketKey = (incidentId: string) => incidentId.replace(/^INC-/, "");

export function enqueueCoverageVerdict(patternId: string, verdict: CoverageVerdict) {
  const key = patternKey(patternId);
  if (!/^[0-9a-f]{6,40}$/.test(key)) return;
  queue.coverage[key] = verdict;
  persistQueue();
  scheduleFlush();
}

export function enqueueTicketVerdict(incidentId: string, verdict: TicketVerdict) {
  const key = ticketKey(incidentId);
  if (!/^\d{1,10}$/.test(key)) return;
  queue.tickets[key] = verdict;
  persistQueue();
  scheduleFlush();
}

function scheduleFlush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flush(), FLUSH_DELAY_MS);
  setState({ error: null });
}

export function retryVerdictSync() {
  if (queueSize() > 0) scheduleFlush();
}

async function flush() {
  if (state.syncing || queueSize() === 0) return;
  // snapshot so verdicts enqueued mid-flight aren't dropped on success
  const sent: Queue = { coverage: { ...queue.coverage }, tickets: { ...queue.tickets } };
  setState({ syncing: true, error: null });
  try {
    const res = await fetch(VERDICTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sent),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 160);
      throw new Error(`save failed (${res.status}): ${detail}`);
    }
    for (const [k, v] of Object.entries(sent.coverage))
      if (JSON.stringify(queue.coverage[k]) === JSON.stringify(v)) delete queue.coverage[k];
    for (const [k, v] of Object.entries(sent.tickets))
      if (JSON.stringify(queue.tickets[k]) === JSON.stringify(v)) delete queue.tickets[k];
    persistQueue();
    setState({ syncing: false });
    if (queueSize() > 0) scheduleFlush();
  } catch (e) {
    setState({ syncing: false, error: e instanceof Error ? e.message : "verdict save failed" });
  }
}

// ---- committed-ledger baselines (mirrors editsService.loadBaseline) --------

export interface VerdictBaselines {
  coverage: Record<string, { status: PatternCoverage; coveredBy: string | null }>;
  tickets: Record<string, { category: IncidentCategory; by: string }>;
}

async function fetchLedger(url: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return {};
    const data: unknown = await res.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {}; // offline / blocked — verdicts just aren't overlaid
  }
}

/** Fetch both committed ledgers, dropping malformed entries (fail open). */
export async function fetchVerdictBaselines(): Promise<VerdictBaselines> {
  const [covRaw, tixRaw] = await Promise.all([
    fetchLedger(COVERAGE_JSON_URL),
    fetchLedger(PENDING_VERDICTS_URL),
  ]);
  const out: VerdictBaselines = { coverage: {}, tickets: {} };
  for (const [k, v] of Object.entries(covRaw)) {
    const e = v as { status?: PatternCoverage; coveredBy?: string | null };
    if (e && COVERAGE_STATUSES.includes(e.status as PatternCoverage))
      out.coverage[k] = { status: e.status as PatternCoverage, coveredBy: e.coveredBy ?? null };
  }
  for (const [k, v] of Object.entries(tixRaw)) {
    const e = v as { category?: IncidentCategory; by?: string };
    if (e && TICKET_CATEGORIES.includes(e.category as IncidentCategory))
      out.tickets[k] = { category: e.category as IncidentCategory, by: e.by ?? "" };
  }
  return out;
}
