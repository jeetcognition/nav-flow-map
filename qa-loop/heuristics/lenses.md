# Bug-hunting lenses (the evolvable exploration algorithm)

Pick **2–4 lenses per run** based on `change-radar.md`. These are the "moves" the
exploratory skill rotates through instead of aimlessly clicking. **This file is
meant to grow:** whenever a run (or a customer incident) reveals a failure mode
no lens covers, add a new lens at the bottom. That is how the exploration keeps
finding things it did not find before.

---

## L1 — Permission boundary

> "What happens if the wrong role does this?"

- Repeat every admin action as a member → expect 403 / clean redirect, never success.
- Cross-org URL while logged into another org → expect 403/404.
- Admin-only API with a member token → expect 401/403.
- Triggers: any change to roles, permissions, or org isolation.

## L2 — State propagation & persistence

> "Does the change show up everywhere it should, and survive a reload?"

- The canonical bug shape: **setting changed + saved, but reverts / is ignored after reload.**
- Admin change in one context → member refreshes in another → does it reflect?
- Role/invite change → sidebar and members list update without re-login.
- Triggers: any toggle, invite, role, or org-settings change.

## L3 — Error path & validation

> "What happens when input is bad or things go wrong?"

- Empty / whitespace / very long / special chars / unicode / XSS / negative / decimal / zero.
- Controls that stay enabled on invalid input; missing client-side validation.
- Slow/interrupted network mid-action → graceful retry, not a 500 or app crash.
- Expired session mid-flow → redirect to login with state preserved.
- Triggers: any new form or multi-step flow.

## L4 — Boundary & off-by-one

> "What happens at exact limits?"

- N-1 / N / N+1 at any quota (members, ACU, concurrent builds).
- Max-length / blank / special-char fields.
- Pluralization boundaries (the "1 members" class of bug).
- Triggers: any limit, quota, or validation-rule change.

## L5 — Auth entry points

> "Every way a user gets in or stays in."

- Fresh login (admin, member), re-login after logout, direct-URL without session, wrong org domain.
- Triggers: any auth, SSO, or session change.

## L6 — Integration handoff

> "Does the external system actually receive what we sent?"

- GitHub webhook fires on PR → 200 in delivery log; GitLab/ADO manual webhook confirmed.
- Slack mapping → Devin message appears in the mapped channel.
- Triggers: any git-provider or Slack integration change.

## L7 — Regression sweep (always last)

> "Did we break something that already worked?"

- Re-verify open `BUG-NNN` records and recently-passing cases for the touched surfaces.
- Confirm no previously-`passed` case is now `failed`.
- Triggers: always run as the final lens.

---

<!-- Add a new lens here. Format: ## LN — Name > one-line framing, bullets, Triggers. -->
