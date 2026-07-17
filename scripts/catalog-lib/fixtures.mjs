import fs from "node:fs";
import { bugsFixturePath, testcasesFixturePath } from "./config.mjs";

export function loadFixtures() {
  const bugs = JSON.parse(fs.readFileSync(bugsFixturePath, "utf8"));
  const bugIds = new Set(bugs.map((bug) => bug.id));

  const testcases = JSON.parse(fs.readFileSync(testcasesFixturePath, "utf8"));
  const legacyById = new Map(
    testcases.map((testcase) => [
      testcase.id,
      { type: testcase.suite, pri: testcase.priority, reach: testcase.reach },
    ]),
  );

  return { bugIds, legacyById };
}
