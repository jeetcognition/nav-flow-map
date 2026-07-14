# 21 — Landing Search Page

Page: `/org/cog-enterprise-qa/org-selector`, the organization selector shown after successful authentication.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ORGSEL-SAN01 | Sanity | P1 | After successful login | Open the organization selector page. | Logo, heading, search field, and organization list are visible and readable. |
| ORGSEL-SAN02 | Sanity | P1 | On the Landing Search page | Inspect the left sidebar. | All organizations, Organizations, Settings, and help icon are visible and aligned. |
| ORGSEL-SAN03 | Sanity | P1 | On the Landing Search page | Inspect organization rows. | Each row shows the organization name, member count, and overflow menu without overlap. |
| ORGSEL-REG01 | Regression | P1 | On the Landing Search page | Search for a valid organization. | Matching organizations are filtered and remain clickable. |
| ORGSEL-REG02 | Regression | P1 | On the Landing Search page | Search with non-matching text. | A clear empty state appears without stale results. |
| ORGSEL-REG03 | Regression | P1 | On the Landing Search page | Search using special, whitespace, emoji, and long inputs. | Input is handled safely without script execution or page failure. |
| ORGSEL-REG04 | Regression | P1 | On the Landing Search page | Click an organization row. | User navigates to the selected organization successfully. |
| ORGSEL-REG05 | Regression | P1 | On the Landing Search page | Click an organization overflow menu. | The correct row's context menu opens without overlap. |
| ORGSEL-REG06 | Regression | P1 | On the Landing Search page | Refresh or use browser back/forward. | The selector page reloads with its core UI intact. |
| ORGSEL-REG07 | Regression | P0 | On the Landing Search page | Inspect the URL, UI, and console while loading, searching, and selecting. | No credentials, sensitive tokens, org secrets, or internal errors are exposed. |
