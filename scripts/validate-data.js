#!/usr/bin/env node
// Cross-checks the app fixtures (nodes, testcases, bugs, incidents) and
// navmap-edits.json — including a PII leak scan on incidents.json, which is
// generated from customer support tickets and lands in a public repo.
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));

const pages = readJson("app/src/data/fixtures/nodes.json");
const testcases = readJson("app/src/data/fixtures/testcases.json");
const bugs = readJson("app/src/data/fixtures/bugs.json");
const incidents = readJson("app/src/data/fixtures/incidents.json");
const patterns = readJson("app/src/data/fixtures/patterns.json");
const incidentsRaw = fs.readFileSync(
  path.join(root, "app/src/data/fixtures/incidents.json"),
  "utf8",
);
const patternsRaw = fs.readFileSync(path.join(root, "app/src/data/fixtures/patterns.json"), "utf8");
const edits = readJson("navmap-edits.json");
// worker-written verdict ledgers (QA-DEC-028)
const coverageLedger = readJson("pipelines/pylon/coverage.json");
const pendingVerdicts = readJson("pipelines/pylon/labels/pending_verdicts.json");
const coverageRaw = fs.readFileSync(path.join(root, "pipelines/pylon/coverage.json"), "utf8");
const pendingRaw = fs.readFileSync(
  path.join(root, "pipelines/pylon/labels/pending_verdicts.json"),
  "utf8",
);

const errors = [];
const pageIds = new Set(pages.map((p) => p.id));
const caseIds = new Set(testcases.map((t) => t.id));
const prefixes = pages.flatMap((p) => p.prefixes || []);

const dup = (a) => [...new Set(a.filter((x, i) => a.indexOf(x) !== i))];
for (const id of dup(pages.map((p) => p.id))) errors.push(`duplicate page id: ${id}`);
for (const id of dup(testcases.map((t) => t.id))) errors.push(`duplicate test case id: ${id}`);
for (const id of dup(bugs.map((b) => b.id))) errors.push(`duplicate bug id: ${id}`);
for (const px of dup(prefixes)) errors.push(`prefix used by multiple pages: ${px}`);

for (const p of pages)
  if (p.parent && !pageIds.has(p.parent))
    errors.push(`page ${p.id} has unknown parent ${p.parent}`);
for (const t of testcases) {
  if (!pageIds.has(t.nodeId)) errors.push(`test case ${t.id} references unknown page ${t.nodeId}`);
  if (!prefixes.some((px) => new RegExp("^" + px + "-(SMK|SAN|REG|E2E)\\d").test(t.id)))
    errors.push(`test case ${t.id} matches no page prefix`);
}
for (const b of bugs) {
  if (!pageIds.has(b.nodeId)) errors.push(`bug ${b.id} references unknown page ${b.nodeId}`);
  for (const cid of b.caseIds || [])
    if (!caseIds.has(cid)) errors.push(`bug ${b.id} references unknown test case ${cid}`);
}
const SEVERITIES = new Set(["S1", "S2", "S3", "S4"]);
const INC_STATUS = new Set(["open", "investigating", "resolved"]);
const VERDICTS = new Set(["definite-bug", "possible-bug", undefined]);
for (const id of dup(incidents.map((i) => i.id))) errors.push(`duplicate incident id: ${id}`);
for (const inc of incidents) {
  if (!pageIds.has(inc.nodeId))
    errors.push(`incident ${inc.id} references unknown page ${inc.nodeId}`);
  if (!SEVERITIES.has(inc.severity)) errors.push(`incident ${inc.id} bad severity`);
  if (!INC_STATUS.has(inc.status)) errors.push(`incident ${inc.id} bad status`);
  if (!VERDICTS.has(inc.verdict)) errors.push(`incident ${inc.id} bad verdict ${inc.verdict}`);
  if (inc.sourceLink && !/^https:\/\//.test(inc.sourceLink))
    errors.push(`incident ${inc.id} sourceLink must be https`);
  if (inc.draftCase && !pageIds.has(inc.draftCase.nodeId))
    errors.push(`incident ${inc.id} draftCase references unknown page ${inc.draftCase.nodeId}`);
}
// Patterns fixture (QA-DEC-027): structure + references.
const SURFACE_IDS = new Set(["enterprise", "retail", "windsurf", "devin-cli"]);
const COVERAGE = new Set(["uncovered", "weak", "covered", "dismissed"]);
const incidentIds = new Set(incidents.map((i) => i.id));
for (const id of dup(patterns.map((p) => p.id))) errors.push(`duplicate pattern id: ${id}`);
const TRENDS = new Set(["new", "accelerating", "stable", "declining"]);
for (const p of patterns) {
  if (!/^PAT-[0-9a-f]{12}$/.test(p.id)) errors.push(`pattern ${p.id} bad id shape`);
  if (!SURFACE_IDS.has(p.surfaceId)) errors.push(`pattern ${p.id} bad surface ${p.surfaceId}`);
  if (!pageIds.has(p.nodeId)) errors.push(`pattern ${p.id} references unknown page ${p.nodeId}`);
  if (!COVERAGE.has(p.coverage)) errors.push(`pattern ${p.id} bad coverage ${p.coverage}`);
  if (!Number.isInteger(p.total) || p.total < 1) errors.push(`pattern ${p.id} bad total`);
  if (!Number.isInteger(p.count14d) || p.count14d < 0) errors.push(`pattern ${p.id} bad count14d`);
  if (!TRENDS.has(p.trend)) errors.push(`pattern ${p.id} bad trend ${p.trend}`);
  if (typeof p.priorityReason !== "string" || !p.priorityReason)
    errors.push(`pattern ${p.id} missing priorityReason`);
  for (const iid of p.incidentIds || [])
    if (!incidentIds.has(iid)) errors.push(`pattern ${p.id} references unknown incident ${iid}`);
  for (const ev of p.evidence || [])
    if (ev.link && !/^https:\/\//.test(ev.link))
      errors.push(`pattern ${p.id} evidence link must be https`);
}

// Verdict ledgers (QA-DEC-028): worker-written — enforce shape here too.
const VERDICT_CATEGORIES = new Set([
  "app-bug",
  "customer-doubt",
  "config-issue",
  "feature-request",
  "unknown",
]);
for (const [pid, v] of Object.entries(coverageLedger)) {
  if (!/^[0-9a-f]{6,40}$/.test(pid)) errors.push(`coverage.json bad pattern id ${pid}`);
  if (!COVERAGE.has(v?.status)) errors.push(`coverage.json ${pid} bad status ${v?.status}`);
}
for (const [num, v] of Object.entries(pendingVerdicts)) {
  if (!/^\d{1,10}$/.test(num)) errors.push(`pending_verdicts.json bad ticket number ${num}`);
  if (!VERDICT_CATEGORIES.has(v?.category))
    errors.push(`pending_verdicts.json ${num} bad category ${v?.category}`);
}

// PII leak gate: the fixtures are generated from support tickets, and the
// verdict ledgers are written by the worker from user input.
for (const [name, raw] of [
  ["incidents.json", incidentsRaw],
  ["patterns.json", patternsRaw],
  ["coverage.json", coverageRaw],
  ["pending_verdicts.json", pendingRaw],
]) {
  const scrubbed = raw.replaceAll("•••@•••", "");
  const emailLeak = scrubbed.match(/[\w.+-]+@[\w-]+\.[\w-]{2,}/);
  if (emailLeak) errors.push(`PII leak in ${name}: email-like string "${emailLeak[0]}"`);
  const orgLeak = scrubbed.match(/app\.devin\.ai\/(org|sessions)\/(?!•••)[\w-]+/);
  if (orgLeak) errors.push(`PII leak in ${name}: unmasked link "${orgLeak[0]}"`);
  const hostLeak = scrubbed.match(/https?:\/\/(?!•••)[\w-]+\.devinenterprise\.com/);
  if (hostLeak) errors.push(`PII leak in ${name}: enterprise host "${hostLeak[0]}"`);
}

for (const l of (edits.addedLinks || []).concat(edits.removedLinks || [])) {
  const added = new Set((edits.addedPages || []).map((p) => p.id));
  for (const end of [l.source, l.target])
    if (!pageIds.has(end) && !added.has(end))
      errors.push(`navmap-edits link references unknown page ${end}`);
}

if (errors.length) {
  for (const e of errors) console.error("ERROR: " + e);
  process.exit(1);
}
console.log(
  `OK: ${pages.length} pages, ${testcases.length} test cases, ${bugs.length} bugs, ${incidents.length} incidents, ${patterns.length} patterns, ` +
    `${Object.keys(coverageLedger).length} coverage verdicts, ${Object.keys(pendingVerdicts).length} pending ticket verdicts (leak scan clean).`,
);
