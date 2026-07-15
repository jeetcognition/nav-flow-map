# 09 — Membership, Roles & IdP Groups

PRD §8.2 (Members/Roles/RBAC/IdP). Page: `/org/cog-enterprise-qa/settings/membership` (tabs: Members, Roles, Groups(IdP)); enterprise-members; idp-groups.

## Members

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| MEMB-SMK01 | Smoke | P1 | Enterprise settings → Membership → Members | Load the page cold. | Heading, Learn more, tab counts, search, filters, Invite members, member table, and pagination render without a page or console error. |
| MEMB-SAN01 | Sanity | P1 | Membership → Members | Inspect the member table. | Selection, Name, Email, Organizations, and Enterprise role columns are visible; names, emails, avatars, and role values are readable. |
| MEMB-SAN02 | Sanity | P1 | Membership → Members | Open **Invite members** without submitting. | Role selector, multi-email field, close control, and disabled Add button are visible. |
| MEMB-SAN03 | Sanity | P1 | Membership → Members | Open **All organizations**. | Search, All organizations, organization names, current selection, and scrolling are usable. |
| MEMB-SAN04 | Sanity | P1 | Membership → Members | Open **All enterprise roles** and the Invite-role selector. | Search and available roles are visible; the current selection is marked. |
| MEMB-REG01 | Regression | P1 | Membership → Members | Search by matching/non-matching name or email, whitespace, Unicode, long, HTML-like, and injection-like text; then clear. | Filtering is literal and safe; no-match state is clear; clearing restores the member list. |
| MEMB-REG02 | Regression | P1 | Membership → Members | Combine organization and enterprise-role filters → search within each dropdown → clear filters. | Only matching members appear; combined filters use correct intersection logic; clearing restores all results. |
| MEMB-REG03 | Regression | P1 | Membership → Members → Invite members | Enter blank, malformed, duplicate, existing-member, whitespace-separated, comma-separated, mixed-validity, and excessive email lists. | Add is gated correctly; actionable validation identifies invalid or duplicate entries; no unintended invite is sent. |
| MEMB-REG04 | Regression | P1 | Membership → Members | Sort Name ascending/descending and move through Previous, Next, and numbered pages with active search and filters. | Sort and pagination are stable; no duplicate or missing rows appear; active criteria behave consistently. |
| MEMB-REG05 | Regression | P1 | Membership → Members | Expand members with zero, one, and many organizations. | Correct organization memberships display for that member only; zero state is clear; expansion stays within the viewport. |
| MEMB-REG06 | Regression | P1 | Membership → disposable member | Record the original role → assign a different role → reload → restore the original role. | Role persists and effective access changes accordingly; cleanup restores the exact original role. |
| MEMB-REG07 | Regression | P0 | Membership → Members | As an unauthorized user or with a tampered member ID, attempt invite, role change, removal, and self-demotion. | Unauthorized changes are denied; the last required admin cannot remove their own administrative access; cross-enterprise data is not exposed. |
| MEMB-REG08 | Regression | P0 | Membership → Members | Inspect URLs, UI, console, and requests while searching, filtering, expanding memberships, and opening Invite members. | No invitation token, credential, private profile data, or internal error is exposed. |
| MEMB-E2E01 | E2E | P0 | Membership → Members | Invite a disposable account with Member role → accept → assign a disposable role and organization → verify allowed/denied actions → remove or revoke it. | Membership and permissions match the assignment; cleanup removes enterprise and organization access plus the disposable invite/member. |

## Roles — `?tab=roles`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ROLE-SMK01 | Smoke | P1 | Membership → Roles | Load the page cold. | Role count, search, scope filter, Create role, and Role/Permissions/Scope/Type columns render without a page or console error. |
| ROLE-SAN01 | Sanity | P1 | Membership → Roles | Inspect role rows. | Enterprise/Organization scope and Built-in/Default/Custom badges are visible with permission counts. |
| ROLE-SAN02 | Sanity | P1 | Membership → Roles | Open the scope filter and **Create role** menu. | All/Enterprise/Organization filters and Create for enterprise/Create for organizations actions are visible. |
| ROLE-SAN03 | Sanity | P1 | Roles → Create for enterprise | Open the form without saving. | Role name, Cancel, disabled Save changes, permission descriptions, checkboxes, and enterprise permission groups are visible. |
| ROLE-SAN04 | Sanity | P1 | Roles → Create for organizations | Open the form without saving. | Organization-specific Usage, Membership, Resource, Data, Stats, Code scan, and Session category permission groups are visible. |
| ROLE-REG01 | Regression | P1 | Membership → Roles | Search with matching/no-match, whitespace, Unicode, long, HTML-like, and injection-like values; then clear. | Results filter safely; no-match state is clear; clearing restores the list. |
| ROLE-REG02 | Regression | P1 | Membership → Roles | Filter All, Enterprise, and Organization while searching. | Rows match the selected scope; same-named roles remain distinguishable by scope; counts and results do not become stale. |
| ROLE-REG03 | Regression | P1 | Membership → Roles | Open Built-in, Default, and Custom roles. | Protected roles cannot be modified or deleted; Custom roles expose only permitted edit controls. |
| ROLE-REG04 | Regression | P1 | Roles → Create role | Attempt creation with blank, duplicate-within-scope, long, whitespace-only, Unicode, emoji, and HTML-like names, with zero permissions. | Clear validation appears; unsafe text stays inert; no invalid role is created; same names in different scopes remain unambiguous if supported. |
| ROLE-REG05 | Regression | P1 | Roles → Create role | Expand/collapse permission groups and select/deselect permissions across groups. | Group state and checkbox selection remain accurate; descriptions stay aligned; implied or dependent permissions are handled clearly. |
| ROLE-REG06 | Regression | P1 | Roles → Create for enterprise | Create `qa-temp-enterprise-role-<timestamp>` with minimal permissions → verify → edit name/permissions → reload → delete. | Enterprise role create/read/update/delete persists correctly; cleanup confirms the role is absent. |
| ROLE-REG07 | Regression | P1 | Roles → Create for organizations | Create `qa-temp-org-role-<timestamp>` → assign to a disposable organization/member → edit → unassign → delete. | Organization role applies only in the assigned organization; cleanup removes all assignments and the role. |
| ROLE-REG08 | Regression | P1 | Roles → Create or edit role | Make unsaved changes, then use Cancel, Back, or another page. | A warning or documented discard behavior occurs; changes are not silently saved or lost. |
| ROLE-REG09 | Regression | P1 | Disposable role | Delete an unassigned role, then attempt deletion while another disposable role is assigned. | Confirmation is required; assigned-role handling is clear and safe; unrelated roles and assignments remain unchanged. |
| ROLE-REG10 | Regression | P0 | Membership → Roles | As a restricted admin or with a tampered role ID, attempt view/create/edit/delete or grant permissions the actor lacks. | Server-side authorization denies privilege escalation and cross-enterprise access. |
| ROLE-E2E01 | E2E | P0 | Roles → Membership | Create a minimal disposable role → assign it to a disposable member → verify one allowed and one denied operation → edit permissions and retest → unassign and delete. | Effective permissions follow the role exactly; updates propagate correctly; cleanup removes the assignment, role, and disposable member. |

## IdP Groups — `?tab=groups`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| IDP-SMK01 | Smoke | P1 | Membership → Groups (IdP) | Load the page cold. | Groups tab activates with count zero; No groups found and IdP/SSO setup guidance are visible. |
| IDP-REG01 | Regression | P1 | Membership → Groups (IdP) | Deep-link, refresh, and use Back/Forward on `?tab=groups`. | Groups remains selected; the empty state does not show stale members, roles, or groups from another tenant. |
| IDP-REG02 | Regression | P0 | Membership → Groups (IdP) | Open Groups as a non-admin or with a tampered enterprise context. | Access follows authorization rules and no cross-enterprise IdP configuration or group data is exposed. |
