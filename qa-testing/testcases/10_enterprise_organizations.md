# 10 — Organizations (enterprise)

PRD §8.1 (Organizations). Page: `/org/cog-enterprise-qa/settings/organizations`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ORG-SMK01 | Smoke | P1 | Enterprise settings → Organizations | Load | Org table renders with columns Name / Slug / Members / Created; pagination (Previous/Next) works. |
| ORG-SAN01 | Sanity | P2 | Organizations | "Search for an organization": type an org name | Filters to matches; clear restores. |
| ORG-REG01 | Regression | P1 | Organizations | Search: XSS/IMG-XSS/SQLi/NoSQL/emoji/whitespace/5000-char/no-match | Inert; no exec/crash. |
| ORG-REG02 | Regression | P2 | Organizations | **Duplicate-name check** — search/scroll to "kush-5" | **BUG-001**: two "kush-5" rows present. Expected: unique names or dedup. |
| ORG-REG03 | Regression | P2 | Organizations | Open **Create organization** form | Fields render: displayName, maxAcuLimit (number, "No limit"), member checkboxes, member search. |
| ORG-REG04 | Regression | P1 | Create org form | **Billing/ACU limit** (maxAcuLimit): enter -5, 0, decimal, huge, text | Invalid rejected; **do NOT submit** (creates real org → N/E). Watch: negative/decimal accepted client-side (prior flag). |
| ORG-REG05 | Regression | P1 | Create org form | **Network policy / domain** add: `javascript:alert(1)`, `<script>`, `http://`, whitespace | **BUG-006**: accepted unvalidated. Expected: reject non-allowlisted/malformed domains. |
| ORG-REG06 | Regression | P2 | Organizations | **Edit** an org (rename, ACU limit) → save | Change persists; reload confirms. **N/E** on real orgs. |
| ORG-REG07 | Regression | P2 | Organizations | **Delete** a test org | Removed; reload confirms; members reassigned/blocked appropriately. **N/E**. |
| ORG-E2E01 | E2E | P2 | Organizations → org selector | Create org → switch to it via org selector → verify isolated repos/env/knowledge | New org isolated; billing pool separate. **N/E without approval.** |
