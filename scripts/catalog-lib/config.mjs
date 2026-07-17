import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const root = path.resolve(__dirname, "../..");
export const pagesDir = path.join(root, "catalog", "pages");
export const schemaPath = path.join(root, "catalog", "schema", "page-catalog.schema.json");
export const bugsFixturePath = path.join(root, "app", "src", "data", "fixtures", "bugs.json");
export const testcasesFixturePath = path.join(
  root,
  "app",
  "src",
  "data",
  "fixtures",
  "testcases.json",
);
