# 18 — Docs: Enterprise Getting Started

Imported from Notion: Devin Enterprise — QA Test Cases (sub-page 18).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| DGS-SMK01 | Smoke | P1 | Open the doc URL | Load cold | Page renders: title "Getting Started with Devin Enterprise", left nav, right TOC (Overview, Organizations, Members & Roles, SSO, Integrations, Next Steps). No console errors; `.md` twin resolves (`…/get-started.md`). |
| DGS-SMK02 | Smoke | P2 | On page | Click each right-TOC anchor | Scrolls to correct `##` heading; URL hash updates. |
| DGS-SAN01 | Sanity | P2 | On page | Click in-body links (Deployment Guide, Organizations card, Custom Roles, IdP Groups, SSO providers, integrations) | Each resolves 200 (no 404); external `mailto:` opens compose. |
| DGS-REG01 | Regression | P2 | On page | Verify all screenshots/`<Frame>` images load | Images 200 from mintcdn; alt text present; no broken image icon. |
| DGS-REG02 | Regression | P3 | Docs search | Search "organizations", "SSO", "RBAC" | Search returns this page + related; results click through correctly. |
| DGS-REG03 | Regression | P1 | Doc "Creating Organizations" | Follow steps: Enterprise Settings → Organizations → Add Organization → name → Add | Real console matches doc: control labels exist; org is created. (Ties to app suite 10 Organizations; N/E on live / delete after.) |
| DGS-REG04 | Regression | P1 | Doc "User Roles" table | Compare the 3 roles (Enterprise Admin / Org Admin / Member) + permissions vs. actual roles in console | Doc matches product; any drift flagged (doc says 3 default roles). |
| DGS-REG05 | Regression | P2 | Doc "Adding Members" | Enterprise Settings → Members → Add Members → email invite | Labels match; invite queued (don't send real invite → N/E). |
| DGS-REG06 | Regression | P2 | Doc "Managing Member Access" | Verify checkbox multi-select + action buttons (Change role / Add orgs / Remove orgs / Remove) exist | Buttons present as documented; org-count expand works. |
| DGS-REG07 | Regression | P2 | Doc "SSO" | Confirm 4 providers listed (Okta, Entra ID, SAML, OIDC) each link live | Matches console SSO options (suite 03). |
| DGS-REG08 | Regression | P2 | Doc "Integrations" | Confirm SCM list (GitHub, GHE, GitLab, Bitbucket, Azure DevOps) + Slack/Teams | Matches console Connected Accounts (suite 12). |
| DGS-E2E01 | E2E | P2 | New enterprise onboarding | Follow the whole guide end-to-end: create org → add member → connect SCM → (staging) configure SSO | A brand-new admin can provision a working org purely from this doc, no missing/incorrect step. Log any friction. **N/E on live tenant.** |
