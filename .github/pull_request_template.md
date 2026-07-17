## What & why

<!-- One concern per PR. Link the issue/suggestion if there is one. -->

## Checklist

- [ ] CI green: prettier, oxlint (deny-warnings), tsc strict, build
- [ ] Behavior-preserving, **or** the behavior change / bug fix is called out above
- [ ] No new hard-coded URLs/IDs/tunables (config lives in `app/src/lib/config.ts` / worker env)
- [ ] Async UI paths added/changed have loading **and** error states
- [ ] No new god files (~300-line ceiling); split into components/hooks
- [ ] Docs updated where it matters (`README`, `AGENTS.md`, `TODO.md`/`AUDIT.md` for debt)
- [ ] New dependencies justified below

## New dependencies

<!-- name + one-line justification, or "none" -->
