# 09 — Membership, Roles & IdP Groups

PRD §8.2 (Members/Roles/RBAC/IdP). Page: `/org/cog-enterprise-qa/settings/membership` (tabs: Members, Roles, Groups(IdP)); enterprise-members; idp-groups.

## Membership tabs

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| MEMB-SMK01 | Smoke | P1 | Enterprise settings → Membership | Load | Renders "Membership"; tabs Members (count) / Roles (count) / Groups(IdP) (count). |
| MEMB-SAN01 | Sanity | P2 | Membership | Deep-link `?tab=members/roles/groups` | Each tab activates correctly; `aria-selected` set. |
| MEMB-SAN02 | Sanity | P3 | Membership | Check member-count label grammar | **BUG-004**: watch "1 members" (should be "1 member"). |
| MEMB-REG01 | Regression | P1 | Members | Search "Search for a member": XSS/IMG-XSS/SQLi/NoSQL/emoji/whitespace/5000-char/no-match | Inert; no exec/crash; results filter literally. |
| MEMB-REG02 | Regression | P1 | Membership | Tamper `?tab=<script>` / `roles' OR '1'='1` / `xyz` / empty | No XSS, no crash, safe fallback. |
| MEMB-REG03 | Regression | P2 | Members | **Invite member**: empty email (Add disabled), invalid email (rejected), valid | Add gated on empty; invalid rejected with message; valid queues invite. (Don't send real invites → N/E.) |
| MEMB-REG04 | Regression | P2 | Members | Filter by role/status; freeze/remove a member | Filters work; freeze/remove persist. **N/E** (membership mutation). |
| MEMB-E2E01 | E2E | P2 | Membership | Invite → accept (staging) → assign role → verify permissions | New member provisioned with correct role scope. **N/E without approval.** |

## Roles — `?tab=roles` / `/settings/roles`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ROLE-SMK01 | Smoke | P1 | Membership → Roles | Load | Role list renders (e.g. 25 roles) with scopes. |
| ROLE-SAN01 | Sanity | P2 | Roles | "Search roles…": XSS/SQLi/emoji/no-match | Inert; filters literally. |
| ROLE-REG01 | Regression | P2 | Roles | Open a role detail | Permissions list renders (ManageSecrets, ViewAccountSessions…); scope shown. |
| ROLE-REG02 | Regression | P2 | Roles | IDOR: open role detail with another tenant's role id in URL | Server denies; no cross-tenant leak. |
| ROLE-REG03 | Regression | P2 | Roles | **Add role** / edit permissions | Form validates; save persists. **N/E** (role mutation). |

## IdP Groups — `/settings/idp-groups` (→ `?tab=groups`)

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| IDP-SMK01 | Smoke | P2 | `/settings/idp-groups` | Load | Redirects to `membership?tab=groups`; group list (may be 0). |
| IDP-REG01 | Regression | P3 | Groups tab | Read help text | **BUG-005**: "provider.<br>Please" missing-space text. Expected: correct spacing. |
| IDP-REG02 | Regression | P2 | Groups tab | Map an IdP group → org/role | Mapping persists; SCIM/SSO provisioning applies. **N/E without IdP.** |
