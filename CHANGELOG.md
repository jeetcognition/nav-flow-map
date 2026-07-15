# Changelog

Record of what changed and **why**. Newest first. Keep this updated for every feature/behaviour change (routine `navmap-edits.json` saves and AI promotions of website edits don't need entries).

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
