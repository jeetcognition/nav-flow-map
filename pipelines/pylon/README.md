# Pylon intake pipeline

Turns Pylon support tickets into the app's Incidents feed via a deterministic
classifier (QA-DEC-025) with an LLM-refined rule table (see `REFINER.md`).
Backend platform context: QA-DEC-024. Provenance: extracted from the
standalone `pylon-test` coverage-gap engine; only the intake modules live
here.

## Flow (engineered path — no manual steps in production)

```
fetcher.py ─▶ pylon_issues.db (local/CI, gitignored)
                 │
        ticket_classifier.py       ← rule table; edits gated by eval
                 │
        export_incidents.py ─▶ app/src/data/fixtures/incidents.json
                 │                   (sanitized: no emails/orgs/customers)
        .github/workflows/pylon-intake.yml
                 └─▶ opens a PR (never pushes to main); CI validates
```

| File                   | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `fetcher.py`           | Incremental Pylon API fetch + 60-day backfill (`PYLON_API_KEY`)          |
| `db.py`                | SQLite storage, 60-day retention                                         |
| `ticket_classifier.py` | Deterministic verdicts: definite-bug / possible-bug / not-app-issue      |
| `eval_classifier.py`   | Metrics vs `labels/eval_set.json`; `--gate` exits non-zero on regression |
| `export_incidents.py`  | Sanitize + node-map + curate → incidents fixture                         |
| `test_pipeline.py`     | Unit tests on synthetic tickets (sanitizer is a security boundary)       |
| `labels/eval_set.json` | Append-only hand-labeled ground truth (ticket numbers only, no PII)      |
| `REFINER.md`           | The LLM rule-refinement loop and its acceptance gates                    |

## Local run

```bash
export PYLON_API_KEY=...   # or put it in pipelines/pylon/.env (gitignored)
python3 fetcher.py         # backfills 60 days on first run
python3 eval_classifier.py --gate
python3 export_incidents.py
npx prettier --write ../../app/src/data/fixtures/incidents.json
node ../../scripts/validate-data.js
```

## Invariants

- **Pylon is read-only.** The pipeline's only Pylon API call is an
  authenticated GET on `/issues` in `fetcher.py`; nothing here ever writes,
  updates, or posts back to Pylon. Enforced mechanically by the read-only
  guard in `test_pipeline.py` (CI fails on any write-shaped call). Prefer a
  read-only-scoped API key in Pylon settings as defense in depth.
- No LLM in the inference path; the LLM only edits the rule table via the
  refiner loop, gated by `eval_classifier.py --gate`.
- Ticket text is PII: the DB and `.env` never leave the machine/runner;
  everything committed is sanitized and leak-checked by
  `scripts/validate-data.js` in CI.
- All automated writes open PRs. Nothing pushes to `main`.
- Eval coverage decays as labeled tickets age past the 60-day fetch window —
  `eval_classifier.py` warns on missing rows; the refiner appends fresh
  labels from UI verifications to compensate.
