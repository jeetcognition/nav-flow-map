# 10 — Organizations (enterprise)

PRD §8.1 (Organizations). Page: `/org/cog-enterprise-qa/settings/organizations`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ORG-SMK01 | Smoke | P1 | Enterprise settings → Organizations | Load the page cold. | Breadcrumb, Back to enterprise, heading and description, search, Create organization, table, row actions, and pagination render without page or console errors. |
| ORG-SAN01 | Sanity | P1 | Organizations | Inspect the table. | Selection, Name, Members, Repositories, and Billing cycle ACU limit columns are visible; each edit and delete action belongs to the correct row. |
| ORG-SAN02 | Sanity | P1 | Organizations | Open a row's edit control without saving. | **Manage organization** modal shows the selected organization name, Billing cycle ACU limit, helper text, and Save changes; current values match the selected row. |
| ORG-SAN03 | Sanity | P1 | Organizations | Inspect the first and last pages. | Previous and Next controls are visible and correctly enabled or disabled for the current page. |
| ORG-REG01 | Regression | P1 | Organizations | Search with full/partial name, no-match, whitespace, case variants, Unicode, long, HTML-like, and injection-like text; then clear. | Filtering is literal and safe; no-match state is clear; clearing restores the organization list. |
| ORG-REG02 | Regression | P1 | Organizations | When multiple existing rows share a display name, search for the name and open each row's edit and delete controls without saving. | Each organization remains unambiguously identifiable; every action targets only the selected row and never another matching organization. |
| ORG-REG03 | Regression | P1 | Organizations | Navigate Previous and Next while search is active, then clear search. | No rows are duplicated or omitted; page state remains valid when filtering reduces the result count. |
| ORG-REG04 | Regression | P1 | Organizations | Select and deselect one row and the header checkbox across pages. | Selection state and counts are accurate; selection never triggers edit or delete; hidden-page rows are not modified unexpectedly. |
| ORG-REG05 | Regression | P1 | Organizations → disposable organization | Record original values → change the name and ACU limit to a valid positive integer → save → reload → restore the originals. | Save succeeds; the table and modal show persisted values; cleanup restores the exact original state. |
| ORG-REG06 | Regression | P1 | Organizations → Manage organization | Enter blank, whitespace-only, duplicate, long, Unicode, emoji, HTML-like, and leading/trailing-space names. | Clear validation appears; unsafe text remains inert; invalid names are not saved; whitespace is handled consistently. |
| ORG-REG07 | Regression | P1 | Organizations → Manage organization | Enter No limit or blank, zero, negative, decimal, text, exponent notation, and leading-zero ACU values. | Supported values save consistently; invalid values show actionable validation and never partially update the organization. |
| ORG-REG08 | Regression | P1 | Organizations → Manage organization | Enter boundary and extremely large positive ACU values, then attempt to save. | The supported range is validated before submission; out-of-range values are rejected clearly and no partial update occurs. |
| ORG-REG09 | Regression | P1 | Organizations → Manage organization | Make unsaved changes, then click outside, press Escape, use Back, or navigate away. | A warning or documented discard behavior occurs; changes are not silently saved or lost. |
| ORG-REG10 | Regression | P1 | Organizations → disposable organization | Click delete → cancel → repeat and confirm. | Confirmation identifies the exact organization; cancel changes nothing; confirm removes only the disposable organization and handles dependencies safely. |
| ORG-REG11 | Regression | P0 | Organizations | As a non-admin or with a tampered organization ID, attempt list, edit, ACU update, and delete operations. | Server-side authorization denies unauthorized and cross-enterprise access without changing organization data. |
| ORG-REG12 | Regression | P0 | Organizations | Inspect URL, UI, console, and requests during search, edit, and delete workflows. | No credentials, tenant secrets, private member data, stack traces, or unnecessary internal identifiers are exposed. |

## Create organization

Page: `/org/cog-enterprise-qa/settings/organizations/create`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ORGCRT-SMK01 | Smoke | P1 | Organizations → Create organization | Load the page cold. | Breadcrumb, Back to Organizations, heading, name and ACU fields, Members, Repository permissions, Cancel, and Create render without page or console errors. |
| ORGCRT-SAN01 | Sanity | P1 | Create organization | Inspect the untouched form. | Organization name is blank, Billing cycle ACU limit shows No limit, and Create is disabled. |
| ORGCRT-SAN02 | Sanity | P1 | Create organization → Members | Inspect the default member state. | Add me as a member, member search, Name and Email columns, pagination, and selected count are visible; the current user is selected by default. |
| ORGCRT-SAN03 | Sanity | P1 | Create organization → Repository permissions | Inspect the section without submitting. | No permissions by default and the repository-permissions link are visible; the form does not silently grant repository access. |
| ORGCRT-REG01 | Regression | P1 | Create organization | Enter blank, whitespace-only, duplicate, long, Unicode, emoji, HTML-like, and leading or trailing-space names. | Invalid or duplicate names are rejected clearly; unsafe text remains inert; Create stays gated until the name is valid. |
| ORGCRT-REG02 | Regression | P1 | Create organization | Enter blank or No limit, zero, a valid positive integer, negative, decimal, text, exponent notation, and leading-zero ACU values. | Only supported values enable Create; invalid values show actionable validation and no organization is partially created. |
| ORGCRT-REG03 | Regression | P1 | Create organization | Enter boundary and extremely large ACU values such as `100000000000000`. | The supported range is shown and out-of-range values are rejected before submission. |
| ORGCRT-REG04 | Regression | P1 | Create organization → Members | Search by member name and email, then try no-match, whitespace, Unicode, long, and HTML-like input; clear it. | Results filter safely; No members found appears when appropriate; clearing restores the member table. |
| ORGCRT-REG05 | Regression | P1 | Create organization → Members | Select and deselect members across several pages and searches. | Selected count and checkboxes remain accurate; no intended selection is lost and no unrelated member is added. |
| ORGCRT-REG06 | Regression | P1 | Create organization → Members | Toggle Add me as a member while selecting other members. | Current-user selection and the corresponding table row remain consistent; duplicate membership is impossible. |
| ORGCRT-REG07 | Regression | P1 | Create organization | Enter form data, then use Cancel, Back, refresh, and revisit the URL without submitting. | No organization is created; returning starts a clean form or restores state only through documented behavior. |
| ORGCRT-REG08 | Regression | P1 | Create organization → Repository permissions | Follow the repository-permissions link, then return. | The correct settings page opens; incomplete organization data is not submitted or retained unexpectedly. |
| ORGCRT-REG09 | Regression | P0 | Create organization | As a non-admin or with a tampered enterprise route, open and attempt to submit the form. | Server-side authorization denies creation and cross-enterprise member access without changing organization data. |
| ORGCRT-REG10 | Regression | P0 | Create organization | Inspect URL, UI, console, and requests while entering names, ACU limits, and member searches. | No credentials, private member data, tenant secrets, stack traces, or unnecessary identifiers are exposed. |
| ORGCRT-E2E01 | E2E | P0 | Create organization | With explicit approval, create `qa-temp-org-<timestamp>` using a bounded ACU limit and disposable member → verify it in Organizations, verify membership and no default repository permissions → delete it. | Creation and tenant isolation work correctly; cleanup confirms the temporary organization and its access are removed even if an intermediate assertion fails. |
