# Conventions — humans and AI agents

Read this before changing anything. CI enforces lint/typecheck/build; the
rest is enforced by review.

## Repository layout

| Path                | What                                                           | Status                                                                                                                         |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `app/`              | QA Command Center — React 19 + Vite + TS strict                | Active development                                                                                                             |
| `catalog/`          | Canonical page/testcase catalog (architecture foundation)      | Active development — currently empty, validated by `scripts/validate-catalog.mjs`                                              |
| `docs/`             | Architecture, decisions, and work-log durable memory           | Append-only documentation                                                                                                      |
| `navmap-edits.json` | Pending website edits (overlay merged over the fixtures)       | Pipeline-owned — written by the save worker, promoted into `app/src/data/fixtures/` by the Devin pass; excluded from Prettier. |
| `worker/`           | Cloudflare Worker: commits edits, starts Devin sessions        | Active; deploy with `wrangler deploy`                                                                                          |
| `qa-testing/`       | Markdown test-case sources maintained by the AI promotion pass | Pipeline-owned                                                                                                                 |

## Rules

- **Tooling gates**: `prettier --check .` (root), `npm run catalog:validate`,
  `app: oxlint --deny-warnings`, `app: tsc -b` (strict), `app: vite build`.
  Nothing merges red. Never weaken a rule to get green — fix the code or discuss first.
- **No new god files**: keep modules under ~300 lines and single-purpose.
  Split pages into `components/<area>/` pieces + hooks like the `flow/` set.
- **Config**: URLs, IDs, endpoints, and tunables go in `app/src/lib/config.ts`
  (overridable via `VITE_*` env vars) or worker env bindings — never inline.
  Secrets never enter the repo; the worker holds them as Cloudflare secrets.
- **Errors**: every async UI path needs loading _and_ error states. No
  swallowed promises, no `alert()`/`prompt()`/`confirm()` — use inline
  validation, banners, or two-step confirms.
- **Data access**: components read/write only through `data/dataService.ts`,
  `data/aiService.ts`, and `data/editsService.ts`. The edits payload shape is
  a wire contract with the worker — do not rename its keys.
- **One concern per PR**, behavior-preserving unless a bug fix is called out
  in the PR title/body. Found an unrelated bug? Separate, labeled PR.
- **Docs are code**: update `AUDIT.md`/`TODO.md` when debt is added or paid,
  the READMEs when setup or architecture changes, and append durable questions,
  answers, and implementation context to `docs/decisions.md` and `docs/work-log.md`.
- New dependencies require a one-line justification in the PR body.

## For the Devin promotion / suggestion pipeline specifically

- Work on a branch and open a PR — never commit directly to `main`.
- Run `app/`'s lint and build before pushing.
- Keep diffs scoped to the promotion/suggestion; never renumber or edit
  unrelated test cases.
