# Classifier refinement loop (QA-DEC-025)

`ticket_classifier.py` is deterministic — no LLM at inference. The LLM's only
job is this periodic maintenance loop, which shrinks over time as the rules
mature.

## When to run

- After every ~25 new human verifications in the Incidents UI, or
- Weekly, if any ticket in the `possible-bug` band was overturned by a human,
  or
- On demand when a missed bug is reported.

## Inputs

1. **Gold labels** — human verification decisions from the Incidents UI
   (confirm/reject on `possible-bug`, plus any `definite-bug` that a human
   rejected). The save worker commits them to
   `labels/pending_verdicts.json` (`{number: {category, by, at}}`,
   QA-DEC-028); map categories to eval labels as app-bug → `bug`,
   customer-doubt/config-issue/feature-request → `not`, unknown → `unsure`.
2. **Disagreements** — tickets where the classifier and a human disagreed.
3. **Low-confidence band** — recent tickets with score within 0.7 of either
   threshold (`POSSIBLE_AT`, `DEFINITE_AT`).

## Process (LLM session, e.g. Claude or a Devin task)

1. Append the new gold labels to `labels/eval_set.json` (never overwrite or
   relabel existing entries — the set is append-only, like the decision log),
   then empty the folded entries out of `labels/pending_verdicts.json` in the
   same PR.
2. Run `python3 eval_classifier.py` → record the BEFORE numbers.
3. Read the disagreement tickets. Propose edits ONLY to:
   - the `RULES` table (add/remove/reweight patterns),
   - `TYPE_WEIGHTS` / `PRIORITY_WEIGHTS`,
   - `DEFINITE_AT` / `POSSIBLE_AT` thresholds.
     Never touch `classify()` control flow; never special-case ticket numbers.
4. Re-run the eval → record the AFTER numbers.
5. Acceptance gate — ALL must hold, else revert and try a different edit:
   - definite-band precision ≥ 95%;
   - overall precision and recall each within 2 points of BEFORE, or better;
   - no previously-passing eval ticket flips to wrong.
6. Commit with the before/after numbers in the commit message. Rule diffs are
   reviewable in the PR like any code change.

## Invariants

- The eval set only grows; population rates must not be read from it (it is
  stratified toward hard cases).
- If two consecutive refinement runs change nothing, lengthen the cadence.
- If a whole new failure family appears (e.g. a new product surface), add a
  new rule group and 10+ labeled examples in the same PR.
