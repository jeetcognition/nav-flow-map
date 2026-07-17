#!/usr/bin/env node
// Cross-checks the app fixtures (nodes, testcases, bugs) and navmap-edits.json.
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));

const pages = readJson("app/src/data/fixtures/nodes.json");
const testcases = readJson("app/src/data/fixtures/testcases.json");
const bugs = readJson("app/src/data/fixtures/bugs.json");
const edits = readJson("navmap-edits.json");

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
console.log(`OK: ${pages.length} pages, ${testcases.length} test cases, ${bugs.length} bugs.`);
