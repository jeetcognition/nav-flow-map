# Changelog

Record of what changed and **why**. Newest first. Keep this updated for every feature/behaviour change (routine `navmap-edits.json` saves and AI promotions of website edits don't need entries).

## 2026-07-16 — Unified QA catalog foundation
- **What:** Established this repository as the active QA platform home, added a versioned canonical testcase schema, migrated the nine Enterprise Devin settings cases as the initial catalog pilot, and added dependency-free local/CI validation for IDs, mappings, cleanup, executor eligibility, automation state, source files, and bug references.
- **Why:** Test definitions, Desktop execution, and Playwright automation need one stable contract and repository boundary before the remaining legacy cases and runners can be consolidated safely.

## 2026-07-16 — Remove QA files imported from the empty repo
- **What:** Deleted `qa-testing/nav_graph.md` and `qa-testing/testcases/01–17_*.md` (the area files imported from jeetcognition/empty's QA suite); kept files 18–23, which were created via this app's promotion flow. Updated README and the testcases README accordingly.
- **Why:** The site never reads these files at runtime — all cases were already parsed into `testcases.js` and the topology lives in `BASE_PAGES` — so they were redundant duplicates of content maintained elsewhere.

## 2026-07-16 — Roomier default graph framing
- **What:** Automatic graph fits now reserve responsive viewport padding (14% of the shorter graph dimension, clamped to 40–120px), while the explicit **Fit view** button retains its tighter 20px fit.
- **Why:** The four-layer landing graph previously filled nearly the entire canvas; the roomier default framing keeps useful space around the hierarchy and makes the overview easier to scan.

## 2026-07-15 — Collapsible, responsive graph branches
- **What:** Every node with children is collapsible. The first four layers open by default, while deeper parents stay collapsed until clicked and user changes persist locally. Hidden extra-link endpoints proxy to their collapsed ancestor, searches reveal hidden matches automatically, and active bug styling rolls up from hidden descendants. The tree measures complete subtree blocks and chooses the column count that best fits the current graph viewport.
- **Why:** Four visible layers preserve useful landing context while progressive disclosure keeps deeper high-fanout branches compact and avoids fixed-row wrapping that placed sibling Settings tabs on fake deeper levels.

## 2026-07-15 — Mobile-responsive application layout
- **What:** Added phone/tablet layouts with a stacked graph and details panel in portrait and side-by-side panes in landscape. The sidebar becomes a dismissible drawer; graph controls remain visible in a compact two-row toolbar; wide tables scroll within the panel; dialogs fit the viewport and stack their fields; controls, inputs, dynamic viewport height, and safe areas are tuned for touch devices.
- **Why:** The desktop-only fixed sidebar, 460px details panel, single-row graph toolbar, wide tables, and desktop dialogs overflowed or became inaccessible on phone-sized screens.

## 2026-07-15 — Inline sidebar-expand button in the graph toolbar
- **What:** When the sidebar is collapsed, the expand button now sits inside the graph top bar, in line with and to the left of the + Add page / + Add link capsules (round pill, same height), instead of floating below them at a fixed position. Its width is included in the cramped-hiding calculation.
- **Why:** The floating expand icon was misaligned with the toolbar row after the sidebar was collapsed.

## 2026-07-15 — Remove sources footer bar
- **What:** Removed the bottom "Sources: qa-testing/nav_graph.md · qa-testing/testcases/*.md · Suites: Sanity (SM/SN) & Regression (RG)" footer bar; the main layout now fills the full viewport height.
- **Why:** User requested the section be removed — it took vertical space without adding value in the app UI.

## 2026-07-15 — Graph toolbar polish (borders, corners, cramped hiding)
- **What:** Removed the outlined container around + Add page / + Add link (buttons keep their own pill outlines). When the search lives on the panel side, the tools pin to the graph's left corner and Fit view/Panel/Split to the right corner (space-between) instead of sticking together. When the graph area is too narrow to fit both capsules, the whole top bar hides.
- **Why:** The double border looked heavy in dark mode; without the search the two groups clumped together; and shrinking the graph via the resizer made the capsules overflow on top of the panel.

## 2026-07-15 — Adaptive search placement + panel-side suggestions
- **What:** The search pill now lives on whichever side is wider: on the graph when the graph area is bigger (unchanged behavior — node highlight/dim, auto-open on a single match), and centered at the top of the detail panel when the panel is wider (or in full-panel mode). On the panel side, typing opens a dropdown of matching page suggestions (name + route); clicking one opens that page and highlights/centers its node in the graph. Placement re-evaluates on panel resize, view-mode change, sidebar collapse and window resize.
- **Why:** When the panel dominates the layout the graph-side search was cramped and highlight-only feedback wasn't visible; on the panel side, clickable page recommendations are more useful.

## 2026-07-15 — Fix graph top-bar control overlap
- **What:** The graph's top controls (+ Add page/+ Add link, the search pill, and Fit view/Panel/Split) are now laid out in a single flex row instead of three independently absolutely-positioned groups. The search flexes in the middle between the two fixed control groups.
- **Why:** When the graph area was narrow (wide detail panel / smaller window), the centered search pill overlapped and covered the side controls — "+ Add link" was clipped to "+" and "Fit view" disappeared. The flex row guarantees the groups never overlap at any width; the search shrinks gracefully instead.

## 2026-07-15 — Graph search bar + collapsible sidebar
- **What:** Moved the page search out of the sidebar into a floating, centered pill at the top of the graph (magnifier icon + a ✕ clear button that appears only when there's text). Added a collapse/expand toggle next to the "Enterprise" brand: it hides the sidebar so the graph reclaims the space (with a `cy.resize()`/`cy.fit()` reflow), shows a small floating expand button while collapsed, and remembers the state in `localStorage["navmap-sidebar"]`.
- **Why:** The user wanted the search where the graph is (more discoverable, more canvas room in the sidebar) and a way to collapse the sidebar for a wider graph view.

## 2026-07-15 — UI redesign (Primer/Linear-style shell, light/dark themes)
- **What:** Reworked the interface into a three-column app shell — left sidebar (brand "Enterprise", search, Bugs, and a bottom row with the red-when-active "Save to repo" plus a circular-arrow reset icon), center graph, right detail panel. Added Inter/JetBrains Mono fonts, hairline borders, rounded 8px cards, blue accent, a dot-grid canvas, and restyled panel/tables/chips/dialogs. Introduced a light/dark theme system (CSS variables, persisted in `navmap-theme`) with a floating sun/moon toggle in the bottom-right; graph edge colours follow the theme. Moved "+ Add page"/"+ Add link" into a floating toolbar at the graph's top-left, gave the graph a Fit view / Panel / Split segmented control (top-right) and the panel a matching Graph / Split control, and redesigned the empty "Select a page" state into a welcome view (numbered main-flow steps + a toolbar tips card).
- **Why:** The previous dark-only toolbar UI felt dated; the user wanted a cleaner, smoother interface (inspired by qa-checklist-omega.vercel.app) with clearer view controls and a light/dark option, while keeping all existing behaviour, data, and persistence unchanged.

## 2026-07-15 — Bugs section (MVP)
- **What:** New `bugs.js` data file (seeded with the 15 known bugs from the QA Bug.md), a per-page "Bugs" table in the side panel (bug ID, severity badge, status, title, linked test-case IDs, Linear/JAM links), a red border on graph nodes with active bugs, a red-bordered "Bugs" toolbar button opening an all-bugs view (severity filters, row click jumps to the node), and a "+ Report bug" dialog that stores draft bugs (`BUG-DRAFT-…`) in local edits → `navmap-edits.json`.
- **Why:** Bugs were tracked only in a separate markdown file; the user wanted all bugs visible in one place *and* surfaced on the page/node they affect, cross-linked to test cases and external trackers. Icons/counts on nodes were dropped in review — just the red border, mirrored on the toolbar button so its meaning is obvious.

## 2026-07-15 — Save/Reset buttons disabled without edits
- **What:** "Save to repo" and "Reset edits" start disabled (tooltip "No unsaved edits") and enable only when local unsaved edits exist; they re-disable after a save or reset.
- **Why:** Prevent pointless saves/resets and make it obvious whether there is anything pending to push.

## 2026-07-15 — Balanced compact tree layout
- **What:** Leaf children stack in rows of up to 4 under their parent instead of one wide row; vertical gap tightened.
- **Why:** The tidy-tree layout gave every leaf its own column, making the graph extremely wide; this balances horizontal vs vertical space.

## 2026-07-15 — AI promotion verifies layout
- **What:** The Worker's Devin prompt gained a LAYOUT step (only when new pages are added): insert promoted pages next to their siblings under the correct parent and visually verify the rendered tree.
- **Why:** Ensure AI-promoted pages always land under the right parent and the graph stays readable.

## 2026-07-15 — Add page / Add link validation
- **What:** Add page rejects duplicate names (case-insensitive), warns on duplicate routes, requires a valid parent; Add link blocks self-links, duplicates, parent-edge duplicates and reverse-direction duplicates.
- **Why:** Users could create confusing duplicate nodes/links with no feedback.

## 2026-07-15 — Tidy-tree layout replaces breadthfirst
- **What:** Custom layout: parents centered over their own children, computed from the real parent fields on every load.
- **Why:** Cytoscape's breadthfirst layout centered rows globally, so Membership's and Organizations' children visually merged into one blob; the new layout keeps every subtree under its own parent and self-corrects after AI promotions.

## 2026-07-14 — Centered dialogs
- **What:** Add page / Add link dialogs open centered on screen (restored `margin: auto` on `dialog`).
- **Why:** The global `* { margin: 0 }` CSS reset wiped the browser's default dialog centering, so dialogs opened pinned to the top-left corner.

## 2026-07-14 — Smarter extra-link routing
- **What:** Extra links draw as a plain straight dashed line when no node blocks the direct path; only blocked links detour through a gutter, choosing the side with the shortest horizontal detour.
- **Why:** A link between adjacent nodes (e.g. Langing Repo Page → Support Page) detoured all the way through the left gutter and back, because the gutter side was picked by the source/target midpoint vs the tree center instead of actual distance.

## 2026-07-14 — Simplified header, prominent Save button
- **What:** Header title shortened to "Enterprise Web App", legend row and "Export edits" button removed, "Save to repo" moved to the top-right corner with a bold red style.
- **Why:** Declutter the toolbar and make the save action impossible to miss so people don't forget to commit their edits.

## 2026-07-14 — Gutter routing & highlight-on-select for extra links
- **What:** Extra links route through a gutter outside the tree's bounding box (exit source sideways → down the empty side → into target from the side), render faint by default, and light up fully when their source or target node is selected.
- **Why:** Straight dashed links cut across nodes and cluttered the graph; a curved-bezier attempt still overlapped nodes and was reverted in favor of gutter routing plus decluttering.

## 2026-07-14 — "+ Add link" between existing pages
- **What:** New "+ Add link" dialog connects two existing pages with an extra navigation link (dashed purple arrow) with a "how to navigate" description; the target page lists it under "Also reachable via" (removable in Edit mode). Persists via `addedLinks`/`removedLinks` in local edits and `navmap-edits.json`. Landing Search Page → Settings shipped as the first committed link.
- **Why:** Some pages are reachable more than one way, but the tree model only allowed a single parent path; extra links record alternate routes without changing the primary tree.

## 2026-07-14 — "How to reach" steps editable
- **What:** In Edit mode each step of the reach path is editable; edits save to the page that owns that step (ancestor edits propagate).
- **Why:** Reach paths drift as the app under test changes; they needed to be correctable in place.

## 2026-07-14 — Auth node, group renames & colors, favicon, reparenting
- **What:** Added "Auth (Email + OTP)" node between Login and Landing with 9 AUTH-* cases; groups renamed/colored to Auth & Entry (Yellow), Workspace (Blue), User settings (Pink), Enterprise settings (Green); mini graph-tree favicon; Top Left Menu reparented under Landing, Preferences/Connections and Sub-org Settings under Settings; Support Page moved to User settings.
- **Why:** Model the real login flow, clearer group semantics with visible color naming, and a tree that matches actual navigation.

## 2026-07-14 — Single Save button with auto AI promotion
- **What:** Removed the separate "Rewrite drafts with AI" button; "Save to repo" always commits `navmap-edits.json`, and the Worker auto-starts a Devin promotion session only when the payload contains promotable edits (drafts, new pages, field edits). Custom links always stay in `navmap-edits.json`.
- **Why:** One button is simpler; the system decides whether AI promotion is needed, avoiding wasted sessions on link-only saves.

## 2026-07-14 — Draggable panel resizer
- **What:** Drag divider between graph and panel (min widths, width persisted, double-click resets).
- **Why:** Fixed 460px panel was too small for wide test-case tables.

## 2026-07-14 — AI promotion pipeline
- **What:** Worker `/rewrite` endpoint spawns a Devin session that rewrites draft cases into structured ones and promotes all edits from `navmap-edits.json` into the canonical sources (`qa-testing/testcases/*.md`, `testcases.js`, `index.html`), then clears the promoted keys.
- **Why:** Drafts were staying as rough one-liners in the overlay file; promotion keeps the markdown sources the single source of truth.

## 2026-07-14 — Notion import & cleanup
- **What:** Imported missing test cases from the Notion QA doc's sub-pages; later removed the Docs/API/CLI/Desktop areas (pages 18–23) from the site, repo and Notion on request.
- **Why:** Keep the map in sync with the curated Notion test suite, scoped to the console app only.

## 2026-07-14 — Token-free saving via Cloudflare Worker
- **What:** "Save to repo" posts to a Worker that holds the GitHub token server-side and commits `navmap-edits.json`; per-user PAT input removed.
- **Why:** A static site can't hold a shared secret safely; the Worker lets anyone save without pasting a token (free tier, CORS-locked to the Pages site).

## 2026-07-14 — Permanent edits layer
- **What:** Site loads committed `navmap-edits.json` over the sources on startup; browser edits live in localStorage until saved. Editable page fields (name, route, description) and draft test cases added.
- **Why:** Make website edits shareable/permanent instead of trapped in one browser.

## 2026-07-14 — Initial release
- **What:** Static Cytoscape.js top-to-bottom navigation flow map of the enterprise app with per-page QA test-case tables (220 cases parsed from `qa-testing/testcases/*.md`), search, filters, panel modes.
- **Why:** One interactive place to see how every page is reached and which test cases cover it.
