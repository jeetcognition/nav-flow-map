# 03 — Enterprise General & SSO

PRD §8.2 (SSO/SAML/OIDC), §11. Page: `/org/cog-enterprise-qa/settings/general`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| GEN-SMK01 | Smoke | P1 | Enterprise settings → General | Load cold | Renders "General" + "Settings › Enterprise" breadcrumb; SSO/domain sections present. (Known: 2× 401 resource loads — non-blocking, BL-037.) |
| GEN-SMK02 | Smoke | P2 | General | Click **Back to enterprise** | Lands `/org/cog-enterprise-qa/settings`. |
| GEN-SAN01 | Sanity | P2 | General | Click **Go to organization settings** | Routes to org settings; no IDOR via swapped id param. |
| GEN-SAN02 | Sanity | P2 | General | Global settings search: `<script>`, `' OR 1=1 --` | Inert; no exec. |
| GEN-REG01 | Regression | P0 | General | Toggle **Require SSO for member access** ON → reload → OFF (revert) | State persists to DB; reload reflects DB (no cached disagreement); OFF re-enables manual invites. **N/E on live tenant without approval** (enterprise-wide auth). |
| GEN-REG02 | Regression | P1 | General | Induce 500 during SSO toggle | Graceful error; previous state preserved; no uncaught promise crash. |
| GEN-REG03 | Regression | P1 | General | As non-admin, attempt PATCH to SSO setting (API) | Backend authz denies; no bypass. |
| GEN-REG04 | Regression | P2 | General | Rapid 10× toggle of SSO switch | No race corruption; final state consistent after reload. |
| GEN-REG05 | Regression | P1 | General | Inspect API traffic on load/toggle | HTTPS only; scoped tokens; CSP headers present; no SQLi echo in headers/body. |
| GEN-REG06 | Regression | P2 | General | Domain verification section | Add/verify domain flow renders; invalid domain rejected. |
| GEN-E2E01 | E2E | P0 | SSO lifecycle (staging only) | Configure SAML/OIDC → enforce → sign out → sign in via IdP | IdP login enforced tenant-wide; non-SSO login blocked. **N/E without approval.** |
