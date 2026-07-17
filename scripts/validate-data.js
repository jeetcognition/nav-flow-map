#!/usr/bin/env node
// Cross-checks BASE_PAGES (index.html), testcases.js, bugs.js, and navmap-edits.json.
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const html = read("index.html");
const m = html.match(/const BASE_PAGES = (\[[\s\S]*?\n\]);/);
if (!m) {
  console.error("BASE_PAGES not found in index.html");
  process.exit(1);
}
const pages = vm.runInNewContext(m[1]);
const testcases = vm.runInNewContext(read("testcases.js") + "\nTESTCASES");
const bugs = vm.runInNewContext(read("bugs.js") + "\nBUGS");
const edits = JSON.parse(read("navmap-edits.json"));

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
  if (!prefixes.some((px) => new RegExp("^" + px + "-(SMK|SAN|REG|E2E)\\d").test(t.id)))
    errors.push(`test case ${t.id} matches no page prefix`);
}
for (const b of bugs) {
  if (!pageIds.has(b.pageId)) errors.push(`bug ${b.id} references unknown page ${b.pageId}`);
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
