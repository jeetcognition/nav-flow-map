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
