// Port of the legacy NavFlow edits layer (index.html) into the React app.
// Owns the browser-local edit overlay and the committed baseline, merged over
// the base graph. The merged payload shape matches exactly what the Cloudflare
// Worker validates and the Devin promotion pipeline consumes — do not rename keys.
import { getNodes } from "./dataService";
import { readStorage, writeStorage } from "../lib/storage";
import { EDITS_JSON_URL, SAVE_ENDPOINT } from "../lib/config";
import type { NavNode } from "../types";

// same key as the legacy site so local edits survive the migration
const STORE_KEY = "navmap-edits-v1";

export interface ExtraLink {
  source: string;
  target: string;
  via?: string;
}

export interface DraftBug {
  id: string;
  title: string;
  severity: "S1" | "S2" | "S3" | "S4";
  status: string;
  pageId: string;
  caseIds: string[];
  links: { linear?: string; jam?: string };
  notes: string;
}

export interface NavEdits {
  addedPages: NavNode[];
  pageOverrides: Record<string, Partial<NavNode>>;
  caseOverrides: Record<string, Record<string, string>>;
  addedCases: Record<string, string[]>;
  addedLinks: ExtraLink[];
  removedLinks: ExtraLink[];
  addedBugs: DraftBug[];
}

export function emptyEdits(): NavEdits {
  return {
    addedPages: [],
    pageOverrides: {},
    caseOverrides: {},
    addedCases: {},
    addedLinks: [],
    removedLinks: [],
    addedBugs: [],
  };
}

function loadStoredEdits(): NavEdits {
  try {
    const raw = readStorage(STORE_KEY);
    return raw ? { ...emptyEdits(), ...JSON.parse(raw) } : emptyEdits();
  } catch {
    return emptyEdits();
  }
}

let EDITS: NavEdits = loadStoredEdits();
let BASELINE: NavEdits = emptyEdits();
let baselineLoaded = false;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function subscribeEdits(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function persist() {
  writeStorage(STORE_KEY, JSON.stringify(EDITS));
  notify();
}

/** Fetch the committed navmap-edits.json once; network failure = empty baseline. */
export async function loadBaseline(): Promise<void> {
  if (baselineLoaded) return;
  baselineLoaded = true;
  try {
    const res = await fetch(EDITS_JSON_URL, { cache: "no-store" });
    if (res.ok) {
      BASELINE = { ...emptyEdits(), ...(await res.json()) };
      notify();
    }
  } catch {
    // offline / blocked — the base graph still renders, only saved edits are missing
  }
}

export function hasLocalEdits(): boolean {
  return (
    EDITS.addedPages.length > 0 ||
    EDITS.addedLinks.length > 0 ||
    EDITS.removedLinks.length > 0 ||
    EDITS.addedBugs.length > 0 ||
    Object.keys(EDITS.pageOverrides).length > 0 ||
    Object.keys(EDITS.caseOverrides).length > 0 ||
    Object.keys(EDITS.addedCases).length > 0
  );
}

/** Baseline + local edits, deduped — the exact payload "Save to repo" posts. */
export function mergedEdits(): NavEdits {
  const m = emptyEdits();
  m.addedPages = BASELINE.addedPages.concat(
    EDITS.addedPages.filter((p) => !BASELINE.addedPages.some((b) => b.id === p.id)),
  );
  for (const src of [BASELINE, EDITS]) {
    for (const [k, v] of Object.entries(src.pageOverrides))
      m.pageOverrides[k] = { ...(m.pageOverrides[k] ?? {}), ...v };
    for (const [k, v] of Object.entries(src.caseOverrides))
      m.caseOverrides[k] = { ...(m.caseOverrides[k] ?? {}), ...v };
    for (const [k, v] of Object.entries(src.addedCases))
      m.addedCases[k] = (m.addedCases[k] ?? []).concat(v);
    for (const l of src.addedLinks)
      if (!m.addedLinks.some((x) => x.source === l.source && x.target === l.target))
        m.addedLinks.push(l);
    for (const r of src.removedLinks)
      if (!m.removedLinks.some((x) => x.source === r.source && x.target === r.target))
        m.removedLinks.push(r);
  }
  m.addedLinks = m.addedLinks.filter(
    (l) => !m.removedLinks.some((r) => r.source === l.source && r.target === l.target),
  );
  for (const src of [BASELINE, EDITS])
    for (const b of src.addedBugs) if (!m.addedBugs.some((x) => x.id === b.id)) m.addedBugs.push(b);
  return m;
}

/** Base nodes + added pages, with page-field overrides applied. */
export function allPages(): NavNode[] {
  const m = mergedEdits();
  return getNodes()
    .concat(m.addedPages)
    .map((p) => ({ ...p, ...(m.pageOverrides[p.id] ?? {}) }));
}

export function extraLinks(): ExtraLink[] {
  const ids = new Set(allPages().map((p) => p.id));
  return mergedEdits().addedLinks.filter((l) => ids.has(l.source) && ids.has(l.target));
}

/** "How to reach" — walk the parent chain collecting `via` steps. */
export function pathTo(page: NavNode): { text: string; pageId: string | null }[] {
  const byId = new Map(allPages().map((p) => [p.id, p]));
  const steps: { text: string; pageId: string | null }[] = [];
  let cur: NavNode | undefined = page;
  const seen = new Set<string>();
  while (cur?.via && !seen.has(cur.id)) {
    seen.add(cur.id);
    steps.unshift({ text: cur.via, pageId: cur.id });
    cur = cur.parent ? byId.get(cur.parent) : undefined;
  }
  steps.unshift({ text: "Open the app → Login page", pageId: null });
  return steps;
}

// ---- mutations (all persist to localStorage immediately, legacy behavior) ----

export function setPageOverride(pageId: string, field: keyof NavNode, value: string) {
  EDITS.pageOverrides[pageId] = { ...(EDITS.pageOverrides[pageId] ?? {}), [field]: value };
  persist();
}

export function setCaseOverride(caseKey: string, field: string, value: string) {
  EDITS.caseOverrides[caseKey] = { ...(EDITS.caseOverrides[caseKey] ?? {}), [field]: value };
  persist();
}

export function addDraftCase(pageId: string, text: string) {
  EDITS.addedCases[pageId] = [...(EDITS.addedCases[pageId] ?? []), text];
  persist();
}

/** Drafts for a page (merged), with any "<pageId>-draft-<i>" overrides applied. */
export function draftCasesFor(pageId: string): { key: string; text: string }[] {
  const m = mergedEdits();
  return (m.addedCases[pageId] ?? []).map((text, i) => {
    const key = `${pageId}-draft-${i}`;
    return { key, text: m.caseOverrides[key]?.steps ?? text };
  });
}

export function addPage(page: NavNode, drafts: string[]) {
  EDITS.addedPages.push(page);
  if (drafts.length) EDITS.addedCases[page.id] = drafts;
  persist();
}

export function addLink(link: ExtraLink) {
  EDITS.removedLinks = EDITS.removedLinks.filter(
    (r) => !(r.source === link.source && r.target === link.target),
  );
  EDITS.addedLinks.push(link);
  persist();
}

export function removeLink(source: string, target: string) {
  EDITS.addedLinks = EDITS.addedLinks.filter((l) => !(l.source === source && l.target === target));
  if (BASELINE.addedLinks.some((l) => l.source === source && l.target === target))
    EDITS.removedLinks.push({ source, target });
  persist();
}

export function addDraftBug(bug: Omit<DraftBug, "id">) {
  EDITS.addedBugs.push({ ...bug, id: `BUG-DRAFT-${EDITS.addedBugs.length + 1}-${bug.pageId}` });
  persist();
}

export function draftBugs(): DraftBug[] {
  return mergedEdits().addedBugs;
}

export function resetLocalEdits() {
  EDITS = emptyEdits();
  persist();
}

// ---- save to repo (Cloudflare Worker; token stays server-side) ----

export interface SaveResult {
  ok: boolean;
  message: string;
  rewriteUrl?: string;
}

export async function saveToRepo(): Promise<SaveResult> {
  const res = await fetch(SAVE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mergedEdits()),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    return { ok: false, message: `Save failed: ${detail}` };
  }
  const data = await res.json().catch(() => ({}) as Record<string, never>);
  BASELINE = mergedEdits();
  EDITS = emptyEdits();
  persist();
  const rewrite = (data as { rewrite?: { url?: string; error?: string } }).rewrite;
  if (rewrite?.url) {
    return {
      ok: true,
      message: "Saved — AI promotion session started (a few minutes; reload afterwards).",
      rewriteUrl: rewrite.url,
    };
  }
  return {
    ok: true,
    message:
      "Saved — edits are committed and will load for everyone." +
      (rewrite?.error ? ` Note: AI promotion could not start: ${rewrite.error}` : ""),
  };
}
