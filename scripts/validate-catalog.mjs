import fs from "node:fs";
import { pagesDir, schemaPath } from "./catalog-lib/config.mjs";
import { validatePageDocument } from "./catalog-lib/document.mjs";
import { loadFixtures } from "./catalog-lib/fixtures.mjs";

// Smoke-check that the schema file itself is valid JSON.
JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const { bugIds, legacyById } = loadFixtures();

const ctx = {
  errors: [],
  pageIds: new Set(),
  testcaseIds: new Set(),
  bugIds,
  legacyById,
};

// An empty catalog is valid: page catalogs are re-authored fresh against the
// schema (QA-DEC-012), so the directory starts empty by design.
const files = fs
  .readdirSync(pagesDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

for (const file of files) {
  const relativeFile = `catalog/pages/${file}`;
  const document = JSON.parse(fs.readFileSync(`${pagesDir}/${file}`, "utf8"));
  validatePageDocument(ctx, document, relativeFile);
}

if (ctx.errors.length > 0) {
  console.error(`Catalog validation failed with ${ctx.errors.length} error(s):`);
  for (const error of ctx.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Catalog validation passed: ${files.length} page file(s), ${ctx.pageIds.size} page(s), ${ctx.testcaseIds.size} testcase(s).`,
);
