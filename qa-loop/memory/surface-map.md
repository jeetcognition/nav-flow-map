# Surface map — the drift baseline

A persisted model of what the live app looks like. **Diffed at the end of every
run**: if a previously-confirmed behavior is gone (possible regression) or a new
surface appeared (untracked → needs coverage), flag it in the run notes before
updating this file. This is how the loop notices what changed without being told.

> This map is intentionally coarse (routes + key controls). Per-case detail lives
> in the catalog; per-run results live in `runResults.json`.

Last updated: — (seed from `empty`'s R1–R7 observations; re-confirm on first run)

## Auth

- Login: email → Auth0 OTP. Success → org-selector or `/home`; failure → inline error.

## Org dashboard (admin)

- Sidebar: Members, Git Providers, Settings, Billing (if ACU enabled).
- Members list: email, role, invite status (Pending/Active). Bulk invite via newline-separated textarea.

## Settings routes (`/org/cog-enterprise-qa/settings/*`)

- general (SSO/SAML/OIDC, domain verify), membership (Members/Roles/Groups), organizations,
  enterprise-members, devin-api (service users), enterprise-devin, review, repositories,
  guardrails (Violations/Configuration), secure-mode-profiles, enterprise-environment,
  infrastructure, connections (+MCP), analytics, consumption, enterprise-sessions.

## Git providers

- GitHub auto-webhook; GitLab/ADO manual "Configure webhook"; GitHub containers flat.

## Permissions

- Admin: full settings/members/git/billing. Member: `/admin/*` → redirect to `/home`.

## API endpoints

- `GET /v2/enterprise/health/me`, `GET /v2/health/me` → 200 + context when authed.

## Secure mode

- Cross-org isolation enforced at session level (exact mechanism needs verification).

---

<!-- After a run, update the changed section and note the run id + date inline. -->
