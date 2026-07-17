export const requiredCaseFields = [
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

export const types = new Set(["Smoke", "Sanity", "Regression", "E2E"]);
export const priorities = new Set(["P0", "P1", "P2", "P3"]);
export const cadences = new Set([
  "deploy",
  "nightly",
  "weekly",
  "release",
  "change-triggered",
  "on-demand",
]);
export const devinBrowserExecutors = new Set(["required", "eligible", "unsupported"]);
export const playwrightExecutors = new Set(["eligible", "blocked", "unsupported"]);
export const automationStatuses = new Set([
  "manual",
  "devinBrowser_verified",
  "candidate",
  "implementation_pr",
  "active",
  "quarantined",
]);
export const sourceTypes = new Set([
  "migration",
  "manual",
  "exploratory",
  "customer-ticket",
  "production-bug",
]);

export const typeTokens = {
  Smoke: "SMK",
  Sanity: "SAN",
  Regression: "REG",
  E2E: "E2E",
};

export const pageIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const prefixPattern = /^[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*$/;
export const testcaseIdPattern = /^[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-(SMK|SAN|REG|E2E)\d{2}$/;
export const riskTagPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const datePattern = /^\d{4}-\d{2}-\d{2}$/;
