# Change Radar — what to test first

Update this at the **start** of each run: pull from the weekly changelog, Slack
`#deploys` / `#enterprise-releases`, Linear resolved bugs, and Pylon incidents.
The exploratory skill reads this to prioritize touched surfaces before doing a
broad sweep. Clear a row once it has been verified in a run (the result lives in
`runs.json` / `bugs.json`, not here).

## Last updated: — (no runs yet in this repo)

## Pending changes to verify

| Area | Change | Source | Priority | Lenses |
| ---- | ------ | ------ | -------- | ------ |
| —    | —      | —      | —        | —      |

<!--
Example row:
| Devin settings | Fusion prerequisite enforcement changed | Changelog #45170 | P0 | L2, L3 |
-->

## How to populate before a run

1. Weekly changelog / `#deploys` → merged PRs since the last run date.
2. Linear → bugs marked fix-verify-needed.
3. Pylon / `incidents.json` → new customer issues since last run.
4. List anything uncertain here; the run will verify it and clear the row.
