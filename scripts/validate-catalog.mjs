import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = path.join(root, "catalog", "pages");
const schemaPath = path.join(root, "catalog", "schema", "page-catalog.schema.json");
const errors = [];
const testcaseIds = new Set();
const pageIds = new Set();

const requiredCaseFields = [
  "id",
  "pageId",
  "surface",
  "title",
  "type",
  "priority",
  "riskTags",
  "cadence",
  "owner",
  "navigation",
  "preconditions",
  "steps",
  "assertions",
  "cleanup",
  "environment",
  "executors",
  "automation",
  "source",
  "linkedBugIds",
  "externalReferences",
  "version",
  "lastReviewed",
];
const types = new Set(["Smoke", "Sanity", "Regression", "E2E"]);
const priorities = new Set(["P0", "P1", "P2", "P3"]);
const cadences = new Set([
  "deploy",
  "nightly",
  "weekly",
  "release",
  "change-triggered",
  "on-demand",
]);
const devinBrowserExecutors = new Set(["required", "eligible", "unsupported"]);
const playwrightExecutors = new Set(["eligible", "blocked", "unsupported"]);
const automationStatuses = new Set([
  "manual",
  "devinBrowser_verified",
  "candidate",
  "implementation_pr",
  "active",
  "quarantined",
]);
const sourceTypes = new Set([
  "migration",
  "manual",
  "exploratory",
  "customer-ticket",
  "production-bug",
]);
const typeTokens = {
  Smoke: "SMK",
  Sanity: "SAN",
  Regression: "REG",
  E2E: "E2E",
};

function fail(location, message) {
  errors.push(`${location}: ${message}`);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function checkAllowedFields(value, allowed, location) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(location, "must be an object");
    return;
  }
  for (const field of Object.keys(value)) {
    if (!allowed.includes(field)) fail(location, `unsupported field ${field}`);
  }
}

function checkStringArray(value, location, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    fail(location, allowEmpty ? "must be an array" : "must be a non-empty array");
    return;
  }
  if (value.some((item) => !isNonEmptyString(item))) {
    fail(location, "must contain only non-empty strings");
  }
  if (new Set(value).size !== value.length) {
    fail(location, "must not contain duplicates");
  }
}

JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const bugs = JSON.parse(
  fs.readFileSync(path.join(root, "app/src/data/fixtures/bugs.json"), "utf8"),
);
const bugIds = new Set(bugs.map((bug) => bug.id));

const testcases = JSON.parse(
  fs.readFileSync(path.join(root, "app/src/data/fixtures/testcases.json"), "utf8"),
);
const legacyById = new Map(
  testcases.map((testcase) => [
    testcase.id,
    { type: testcase.suite, pri: testcase.priority, reach: testcase.reach },
  ]),
);

// An empty catalog is valid: page catalogs are re-authored fresh against the
// schema (QA-DEC-012), so the directory starts empty by design.
const files = fs
  .readdirSync(pagesDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

for (const file of files) {
  const relativeFile = path.join("catalog", "pages", file);
  const document = JSON.parse(fs.readFileSync(path.join(pagesDir, file), "utf8"));

  checkAllowedFields(document, ["$schema", "schemaVersion", "page", "testcases"], relativeFile);
  if (document.$schema !== "../schema/page-catalog.schema.json") {
    fail(relativeFile, "must reference ../schema/page-catalog.schema.json");
  }
  if (document.schemaVersion !== 1) {
    fail(relativeFile, "schemaVersion must be 1");
  }
  if (!document.page || typeof document.page !== "object") {
    fail(relativeFile, "page is required");
    continue;
  }

  const pageLocation = `${relativeFile}#page`;
  const { page } = document;
  checkAllowedFields(page, ["id", "name", "route", "prefixes"], pageLocation);
  if (!isNonEmptyString(page.id)) fail(pageLocation, "id is required");
  if (isNonEmptyString(page.id) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.id)) {
    fail(pageLocation, "id must use lowercase kebab-case");
  }
  if (!isNonEmptyString(page.name)) fail(pageLocation, "name is required");
  if (!isNonEmptyString(page.route)) fail(pageLocation, "route is required");
  checkStringArray(page.prefixes, `${pageLocation}.prefixes`);
  for (const prefix of page.prefixes || []) {
    if (!/^[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*$/.test(prefix)) {
      fail(pageLocation, `invalid prefix ${prefix}`);
    }
  }
  if (pageIds.has(page.id)) fail(pageLocation, `duplicate page ID ${page.id}`);
  pageIds.add(page.id);

  if (!Array.isArray(document.testcases) || document.testcases.length === 0) {
    fail(relativeFile, "testcases must be a non-empty array");
    continue;
  }

  for (const testcase of document.testcases) {
    const location = `${relativeFile}#${testcase.id || "unknown"}`;
    checkAllowedFields(testcase, requiredCaseFields, location);
    for (const field of requiredCaseFields) {
      if (!(field in testcase)) fail(location, `missing required field ${field}`);
    }

    if (!isNonEmptyString(testcase.id)) continue;
    if (!/^[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-(SMK|SAN|REG|E2E)\d{2}$/.test(testcase.id)) {
      fail(location, "ID does not follow <PREFIX>-<SMK|SAN|REG|E2E><NN>");
    }
    if (testcaseIds.has(testcase.id)) fail(location, `duplicate testcase ID ${testcase.id}`);
    testcaseIds.add(testcase.id);

    if (testcase.pageId !== page.id) {
      fail(location, `pageId ${testcase.pageId} does not match page ${page.id}`);
    }
    if (testcase.surface !== "webapp") {
      fail(location, `unsupported surface ${testcase.surface}; current scope is webapp only`);
    }
    if (!page.prefixes.some((prefix) => testcase.id.startsWith(`${prefix}-`))) {
      fail(location, `ID does not use one of page prefixes: ${page.prefixes.join(", ")}`);
    }
    if (!types.has(testcase.type)) fail(location, `unsupported type ${testcase.type}`);
    if (!priorities.has(testcase.priority))
      fail(location, `unsupported priority ${testcase.priority}`);
    if (types.has(testcase.type) && !testcase.id.includes(`-${typeTokens[testcase.type]}`)) {
      fail(location, `ID token does not match type ${testcase.type}`);
    }
    if (!isNonEmptyString(testcase.title)) fail(location, "title is required");
    if (!isNonEmptyString(testcase.owner)) fail(location, "owner is required");
    if (!isNonEmptyString(testcase.navigation)) fail(location, "navigation is required");
    checkStringArray(testcase.riskTags, `${location}.riskTags`);
    for (const riskTag of testcase.riskTags || []) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(riskTag)) {
        fail(location, `risk tag must use lowercase kebab-case: ${riskTag}`);
      }
    }
    checkStringArray(testcase.preconditions, `${location}.preconditions`);
    checkStringArray(testcase.assertions, `${location}.assertions`);

    if (!Array.isArray(testcase.cadence) || testcase.cadence.length === 0) {
      fail(location, "cadence must be a non-empty array");
    } else {
      for (const cadence of testcase.cadence) {
        if (!cadences.has(cadence)) fail(location, `unsupported cadence ${cadence}`);
      }
      if (new Set(testcase.cadence).size !== testcase.cadence.length) {
        fail(location, "cadence must not contain duplicates");
      }
    }

    if (!Array.isArray(testcase.steps) || testcase.steps.length === 0) {
      fail(location, "steps must be a non-empty array");
    } else {
      testcase.steps.forEach((step, index) => {
        checkAllowedFields(step, ["number", "action"], `${location}.steps[${index}]`);
        if (step.number !== index + 1) fail(location, "step numbers must be sequential from 1");
        if (!isNonEmptyString(step.action)) fail(location, `step ${index + 1} action is required`);
      });
    }

    if (!testcase.cleanup || typeof testcase.cleanup.required !== "boolean") {
      fail(location, "cleanup.required must be boolean");
    } else {
      checkAllowedFields(testcase.cleanup, ["required", "steps"], `${location}.cleanup`);
      checkStringArray(testcase.cleanup.steps, `${location}.cleanup.steps`, { allowEmpty: true });
      if (testcase.cleanup.required && testcase.cleanup.steps.length === 0) {
        fail(location, "cleanup steps are required when cleanup.required is true");
      }
    }

    checkAllowedFields(testcase.environment, ["targets", "roles"], `${location}.environment`);
    checkStringArray(testcase.environment?.targets, `${location}.environment.targets`);
    checkStringArray(testcase.environment?.roles, `${location}.environment.roles`);

    checkAllowedFields(
      testcase.executors,
      ["devinBrowser", "playwright", "blockedReason"],
      `${location}.executors`,
    );
    if (!devinBrowserExecutors.has(testcase.executors?.devinBrowser)) {
      fail(location, `unsupported devinBrowser executor ${testcase.executors?.devinBrowser}`);
    }
    if (!playwrightExecutors.has(testcase.executors?.playwright)) {
      fail(location, `unsupported Playwright executor ${testcase.executors?.playwright}`);
    }
    if (
      testcase.executors?.playwright === "blocked" &&
      !isNonEmptyString(testcase.executors.blockedReason)
    ) {
      fail(location, "blocked Playwright cases require blockedReason");
    }

    checkAllowedFields(testcase.automation, ["status", "specPath"], `${location}.automation`);
    if (!automationStatuses.has(testcase.automation?.status)) {
      fail(location, `unsupported automation status ${testcase.automation?.status}`);
    }
    if (
      ["implementation_pr", "active"].includes(testcase.automation?.status) &&
      !isNonEmptyString(testcase.automation?.specPath)
    ) {
      fail(location, `${testcase.automation.status} automation requires specPath`);
    }
    if (
      testcase.automation?.specPath !== null &&
      !isNonEmptyString(testcase.automation?.specPath)
    ) {
      fail(location, "automation.specPath must be a non-empty string or null");
    }

    if (!Number.isInteger(testcase.version) || testcase.version < 1) {
      fail(location, "version must be a positive integer");
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(testcase.lastReviewed) ||
      Number.isNaN(Date.parse(`${testcase.lastReviewed}T00:00:00Z`))
    ) {
      fail(location, "lastReviewed must use YYYY-MM-DD");
    }

    checkAllowedFields(testcase.source, ["type", "reference"], `${location}.source`);
    if (!isNonEmptyString(testcase.source?.type) || !isNonEmptyString(testcase.source?.reference)) {
      fail(location, "source type and reference are required");
    } else {
      if (!sourceTypes.has(testcase.source.type)) {
        fail(location, `unsupported source type ${testcase.source.type}`);
      }
      if (
        testcase.source.type === "migration" &&
        !fs.existsSync(path.join(root, testcase.source.reference))
      ) {
        fail(location, `source reference does not exist: ${testcase.source.reference}`);
      }
    }

    checkStringArray(testcase.linkedBugIds, `${location}.linkedBugIds`, { allowEmpty: true });
    for (const bugId of testcase.linkedBugIds || []) {
      if (!bugIds.has(bugId)) fail(location, `unknown linked bug ${bugId}`);
    }

    if (!Array.isArray(testcase.externalReferences)) {
      fail(location, "externalReferences must be an array");
    } else {
      testcase.externalReferences.forEach((reference, index) => {
        checkAllowedFields(
          reference,
          ["system", "id", "url"],
          `${location}.externalReferences[${index}]`,
        );
        if (!isNonEmptyString(reference.system) || !isNonEmptyString(reference.id)) {
          fail(location, `external reference ${index + 1} requires system and id`);
        }
        if (reference.url) {
          try {
            const url = new URL(reference.url);
            if (!["http:", "https:"].includes(url.protocol)) throw new Error();
          } catch {
            fail(location, `external reference ${index + 1} URL must use HTTP(S)`);
          }
        }
      });
    }

    // Legacy cross-check applies only to cases migrated from the Nav Flow dataset;
    // cases authored from other sources (manual, exploratory, customer-ticket,
    // production-bug) legitimately have no legacy counterpart.
    if (testcase.source?.type === "migration") {
      const legacy = legacyById.get(testcase.id);
      if (!legacy) {
        fail(location, "migrated testcase is missing from the current Nav Flow dataset");
      } else {
        if (legacy.type !== testcase.type) fail(location, `legacy type is ${legacy.type}`);
        if (legacy.pri !== testcase.priority) fail(location, `legacy priority is ${legacy.pri}`);
        if (legacy.reach !== testcase.navigation)
          fail(location, `legacy navigation is ${legacy.reach}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Catalog validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Catalog validation passed: ${files.length} page file(s), ${pageIds.size} page(s), ${testcaseIds.size} testcase(s).`,
);
