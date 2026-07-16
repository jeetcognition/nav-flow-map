# QA run reports

Each completed Playwright QA run gets one Markdown report in this directory. Name
reports with the run identifier and date, for example `R001-2026-08-01.md`.

Every report should record:

- Run ID and date
- Environment and build/commit
- Scope (case IDs, areas, or Playwright spec files)
- Pass, fail, blocked, and untested counts
- New bugs, including links to their case IDs and evidence
- Notes about setup or skipped coverage

Case-level status is kept separately in `qa-testing/results.json`; this directory
contains the durable human-readable run summaries.
