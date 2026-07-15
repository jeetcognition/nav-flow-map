# 03 — Enterprise General & SSO

PRD §8.2 (SSO/SAML/OIDC), §11. Page: `/org/cog-enterprise-qa/settings/general`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| GEN-SMK01 | Smoke | P1 | Settings → General | Load cold. | General and Authentication sections render, including Require SSO for member access, without page errors. |
| GEN-SAN01 | Sanity | P1 | General | Inspect the SSO requirement switch and help text without changing it. | Current state, impact, and admin-only nature are clear; the control is not ambiguous or mislabeled. |
| GEN-REG01 | Regression | P0 | General → Require SSO | With explicit approval, toggle Require SSO, reload, then restore. | State persists exactly; auth behavior follows the saved value; cleanup restores the original setting. |
| GEN-REG02 | Regression | P1 | General → Require SSO | Force or simulate save failure while toggling. | Error is clear; previous state is preserved; UI does not show a saved state that the server rejected. |
| GEN-REG03 | Regression | P0 | General | As non-admin or with tampered enterprise ID, attempt to view/update SSO settings. | Server-side authorization denies unauthorized or cross-enterprise access. |
| GEN-REG04 | Regression | P1 | General | Rapidly toggle SSO in a disposable/staging enterprise or mocked environment. | Final persisted state is deterministic; concurrent saves cannot leave client/server disagreement. |
| GEN-REG05 | Regression | P1 | General | Inspect UI, URL, console, and requests while loading and saving. | No auth tokens, IdP secrets, stack traces, or internal configuration values are exposed. |
