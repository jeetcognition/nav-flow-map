# Repository operating rules

These rules apply to every human or agent changing this repository.

## Durable documentation is required

Before starting work, read:

1. `docs/decisions.md`
2. `docs/work-log.md`
3. `docs/architecture.md`
4. `CHANGELOG.md`

Before completing work:

- Append every scope, architecture, terminology, workflow, or behavior question and its accepted answer to `docs/decisions.md`.
- Append a concise record of requested work, implementation, validation, and deferred items to `docs/work-log.md`.
- Update `CHANGELOG.md` for user-visible features or behavior changes.
- Link implementation entries to the relevant decision ID and PR when available.
- Run `npm run check`.

Do not silently rewrite history. If a decision changes, add a new entry that marks the earlier decision as superseded. Distinguish accepted decisions from proposals and open questions.

Do not record secrets, credentials, authentication codes, private customer content, or raw personally identifiable information. Record sanitized references and external IDs instead.

Routine commands and transient debugging output do not need verbatim logging; preserve the durable request, answer, rationale, result, and unresolved risks.
