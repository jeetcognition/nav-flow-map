# Scope — environments, accounts, and hard limits

## Environments

| Name               | URL                                                  | When                                     |
| ------------------ | ---------------------------------------------------- | ---------------------------------------- |
| **Beta** (default) | `https://cog-enterprise-qa.beta.devinenterprise.com` | Default for all runs                     |
| Staging            | `https://qa.staging.devinenterprise.com`             | Only when change-radar says staging-only |

- Enterprise slug: `cog-enterprise-qa` (display "Cog Enterprise QA").
- Sub-org under test: display **jeet-test-org**, slug **jeet-devin-qa**
  (routes use the slug; `/org/jeet-test-org/*` 404s — a known trap).
- Enterprise settings routes: `/org/cog-enterprise-qa/settings/<page>`.

Config defaults live in code (`app/src/lib/config.ts`, `DEFAULT_SURFACE`) and in
`tests/playwright/.env.example` (`BASE_URL`, `ENTERPRISE_SLUG`, `TEST_SUBORG`);
keep this file aligned with those, not duplicating secrets.

## Accounts (labels only — never store credentials here)

| Role   | Env     | Purpose                                                                |
| ------ | ------- | ---------------------------------------------------------------------- |
| Admin  | beta    | Primary admin for org/settings changes. Email via `DEVIN_ADMIN_EMAIL`. |
| Member | beta    | Second context for permission/propagation checks.                      |
| Admin  | staging | Staging admin.                                                         |

Credentials come from session secrets / `.env`, referenced by label. The OTP is
entered by the human once per session; it is never fetched programmatically in
the Devin-browser skills (the Playwright suite has its own Gmail-IMAP OTP path).

## Git test repos (for webhook / PR-flow cases)

| Provider     | Repo      | Notes             |
| ------------ | --------- | ----------------- |
| GitHub       | _fill in_ | Webhook + PR flow |
| GitLab       | _fill in_ | Manual webhook    |
| Azure DevOps | _fill in_ | Manual webhook    |

## Destructive-action denylist (hard stop — needs explicit human approval)

Never do these without approval, and always revert a toggled setting in the same case:

- Delete/rename any org, workspace, real user, or membership.
- Change billing plan or ACU limits on a live org.
- Enable/Save SSO / SAML / OIDC on a real org.
- Rotate or delete secrets, API keys, or service users.
- Push code to a production-connected repo.
- Send invites/messages to real (non-test) email addresses.
- Create throwaway orgs/automations to test server-side persistence (log to
  `memory/backlog.md` instead unless explicitly approved).
- Commit any screenshot that visibly contains a live secret (`apk_…`, `cog_…`);
  document redacted, in text only.

When a case requires a denylisted action, mark it `blocked` with the reason and
flag it for manual execution.
