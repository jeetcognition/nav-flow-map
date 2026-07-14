# 21 — Landing Search Page

Page: `/org/cog-enterprise-qa/org-selector`, the organization selector shown after successful authentication.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ORGSEL-SAN01 | Sanity | P1 | After successful login | Open the organization selector page. | Logo, heading, search field, and organization list are visible and readable. |
| ORGSEL-SAN02 | Sanity | P1 | On the Landing Search page | Inspect the left sidebar. | All organizations, Organizations, Settings, and help icon are visible and aligned. |
| ORGSEL-SAN03 | Sanity | P1 | On the Landing Search page | Inspect organization rows. | Each row shows the organization name, member count, and overflow menu without overlap. |
| ORGSEL-SAN04 | Sanity | P1 | On the Landing Search page | Open an organization row overflow menu. | Menu is visible beside the selected row with **Pin organization** and **Manage settings** options. |
| ORGSEL-SAN05 | Sanity | P1 | On the Landing Search page | Open the bottom help menu from the `?` icon. | **Contact support**, **Documentation**, and **Contact sales** are visible and readable. |
| ORGSEL-SAN06 | Sanity | P1 | On the Landing Search page | Hover the sidebar collapse control. | Tooltip shows **Collapse sidebar** with the keyboard shortcut and does not overlap critical content. |
| ORGSEL-SAN07 | Sanity | P1 | On the Landing Search page | Collapse the sidebar and hover the expand control. | Compact sidebar is visible, and tooltip shows **Expand sidebar** with the keyboard shortcut. |
| ORGSEL-SAN08 | Sanity | P1 | On the Landing Search page | Hover the search icon in the sidebar. | Tooltip shows **Search** with the keyboard shortcut. |
| ORGSEL-SAN09 | Sanity | P1 | On the Landing Search page | Open the global command/search palette. | Search input, Actions, Navigation, and Settings sections are visible and readable. |
| ORGSEL-SAN10 | Sanity | P1 | On the Landing Search page | Open the **All organizations** dropdown. | Enterprise card, Enterprise settings, Invite members, organization list, Switch account, and Log out are visible. |
| ORGSEL-REG01 | Regression | P1 | On the Landing Search page | Search for a valid organization. | Matching organizations are filtered and remain clickable. |
| ORGSEL-REG02 | Regression | P1 | On the Landing Search page | Search with non-matching text. | A clear empty state appears without stale results. |
| ORGSEL-REG03 | Regression | P1 | On the Landing Search page | Search using special, whitespace, emoji, and long inputs. | Input is handled safely without script execution or page failure. |
| ORGSEL-REG04 | Regression | P1 | On the Landing Search page | Click an organization row. | User navigates to the selected organization successfully. |
| ORGSEL-REG05 | Regression | P1 | On the Landing Search page | Click an organization overflow menu. | The correct row's context menu opens without overlap. |
| ORGSEL-REG06 | Regression | P1 | On the Landing Search page | Refresh or use browser back/forward. | The selector page reloads with its core UI intact. |
| ORGSEL-REG07 | Regression | P0 | On the Landing Search page | Inspect the URL, UI, and console while loading, searching, and selecting. | No credentials, sensitive tokens, org secrets, or internal errors are exposed. |
| ORGSEL-REG08 | Regression | P1 | On the Landing Search page | Click **Pin organization** from a row overflow menu. | Selected organization is pinned or shows pinned state without navigating away unexpectedly. |
| ORGSEL-REG09 | Regression | P1 | On the Landing Search page | Click **Manage settings** from a row overflow menu. | User navigates to settings for the selected organization or sees a safe permission-aware block. |
| ORGSEL-REG10 | Regression | P1 | On the Landing Search page | Click each help menu item. | Contact support opens support flow; Documentation and Contact sales open the correct destinations safely. |
| ORGSEL-REG11 | Regression | P1 | On the Landing Search page | Toggle sidebar collapse and expand using the button and shortcut. | Sidebar state changes correctly and main content remains usable without clipping. |
| ORGSEL-REG12 | Regression | P1 | On the Landing Search page | Use the command palette to search for navigation items. | Matching commands filter correctly and can be selected without stale or broken results. |
| ORGSEL-REG13 | Regression | P1 | On the Landing Search page | Select **Switch organization** from the command palette. | Organization switch flow opens and the user remains on a valid page state. |
| ORGSEL-REG14 | Regression | P1 | On the Landing Search page | Use the **All organizations** dropdown search/list controls. | Organizations filter/select correctly, and the current organization remains clearly indicated. |
| ORGSEL-REG15 | Regression | P1 | On the Landing Search page | Click **Enterprise settings** and **Invite members** in the dropdown. | Each button navigates to the expected page or shows a permission-safe message. |
| ORGSEL-REG16 | Regression | P1 | On the Landing Search page | Click **Switch account** and **Log out** in the dropdown. | Switch account opens account selection; Log out signs out and prevents protected content from remaining accessible. |
| ORGSEL-REG17 | Regression | P0 | On the Landing Search page | Inspect URL, UI, and console while opening menus, command palette, and org dropdown. | No credentials, tokens, org secrets, or internal errors are exposed. |
