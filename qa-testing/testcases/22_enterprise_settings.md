# 22 — Enterprise Settings

Page: `/org/cog-enterprise-qa/settings`. Root page only; individual settings pages have their own area files.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ENTSET-SAN01 | Sanity | P1 | Top Left Menu → Enterprise settings | Open Enterprise Settings. | **Settings › Enterprise** breadcrumb, **Enterprise Settings** heading, and description are visible and readable. |
| ENTSET-SAN02 | Sanity | P1 | Enterprise Settings | Inspect the left sidebar. | Back to app, settings search, Personal links, enterprise name, enterprise navigation, organization list, and help control are visible without overlap. |
| ENTSET-SAN03 | Sanity | P1 | Enterprise Settings | Inspect **Enterprise preferences and settings**. | **General**, **Connections**, and **Sessions** cards are visible with icons and navigation arrows. |
| ENTSET-SAN04 | Sanity | P1 | Enterprise Settings | Inspect **Products**. | **Devin** and **Review** cards are visible and readable. |
| ENTSET-SAN05 | Sanity | P1 | Enterprise Settings | Inspect **Resources**. | **Knowledge**, **Environment**, **Playbooks**, and **Skills & Rules** cards are visible and readable. |
| ENTSET-SAN06 | Sanity | P1 | Enterprise Settings | Scroll to **Administration**. | **Repositories**, **Membership**, **Organizations**, **Devin API**, **Guardrails** with Beta badge, **Infrastructure**, and **Analytics** are visible. |
| ENTSET-REG01 | Regression | P1 | Enterprise Settings | Open each card from the main panel, then return. | Every card opens its matching enterprise settings page and retains the `Cog Enterprise QA` context. |
| ENTSET-REG02 | Regression | P1 | Enterprise Settings | Search settings using matching, non-matching, special-character, and long text. | Matching settings filter correctly; no-match state is clear; input remains inert and the page stays usable. |
| ENTSET-REG03 | Regression | P1 | Enterprise Settings | Click **Back to app**, then return with browser Back. | User returns to the app safely; browser Back restores Enterprise Settings without a blank or broken state. |
| ENTSET-REG04 | Regression | P1 | Enterprise Settings | Select another organization from the sidebar organization list. | The selected organization's settings open and the enterprise context does not leak into the organization page. |
| ENTSET-REG05 | Regression | P1 | Enterprise Settings | Scroll the sidebar organization list and click **Load more** when available. | More organizations load without duplicates, layout shifts, or losing the current settings page. |
| ENTSET-REG06 | Regression | P0 | Enterprise Settings | Open Enterprise Settings as a user without enterprise-admin access. | Restricted settings are hidden or access-denied; no unauthorized enterprise data or actions are exposed. |
| ENTSET-REG07 | Regression | P1 | Enterprise Settings | Refresh and use browser Back/Forward on the root page. | The same enterprise context and usable layout are restored without navigation loops. |
| ENTSET-REG08 | Regression | P0 | Enterprise Settings | Inspect the URL, UI, network responses, and console while using the page. | No credentials, tokens, private configuration values, or internal errors are exposed. |
