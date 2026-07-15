# 04 — Enterprise Devin settings

PRD §2/§6.2 (Devin product + bot-comment). Page: `/org/cog-enterprise-qa/settings/enterprise-devin`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| DEVIN-SMK01 | Smoke | P1 | Enterprise settings → Devin | Load | Renders "Devin"; 6 toggles (Ultra, Fast mode, Fusion, Enable native deployments, Allow web search tool, Lock user commit email) + Git commit attribution + Open PRs as. |
| DEVIN-SAN01 | Sanity | P1 | Devin | Toggle **Allow web search tool** ON→reload→revert | Persists (web-search saves fine — contrast BUG-015). |
| DEVIN-REG01 | Regression | P0 | Devin | Toggle **Ultra** → wait → reload | **Known BUG-015**: PUT/PATCH returns **400** + "Failed to update" toast; state does NOT persist. Expected once fixed: persists + reverts cleanly. |
| DEVIN-REG02 | Regression | P0 | Devin | Toggle **Fast mode** → reload | **Known BUG-015**: 400, no persist. |
| DEVIN-REG03 | Regression | P2 | Devin | Toggle **Fusion**, **Enable native deployments** → reload → revert | Persist + revert. |
| DEVIN-REG04 | Regression | P1 | Devin | Open **Git commit author** dropdown | Exactly 7 options: Per-user (Default), Devin only, Co-authored (Devin+you), Co-authored (you+Devin), You only, You as author/Devin committer, Devin as author/you committer. |
| DEVIN-REG05 | Regression | P2 | Devin | Select each commit-author option → reload | Selection persists; metadata applied to commits. (Mutates enterprise git behavior → revert.) |
| DEVIN-REG06 | Regression | P1 | Devin | **Commit email** dropdown → "Custom email…" → enter invalid / empty / 2000-char / `' OR 1=1 --` | Options Default + Custom email; malformed rejected server-side. |
| DEVIN-REG07 | Regression | P2 | Devin | Toggle **Lock user commit email** ON | Standard users cannot override; enforce via API attempt (IDOR check). |
| DEVIN-REG08 | Regression | P1 | Devin | Open **Open PRs as** dropdown | Exactly 4: Devin / User / User only / Per-organization (with correct descriptions). |
| DEVIN-REG09 | Regression | P2 | Devin | Select each "Open PRs as" → reload | Persists; behavior matches description. |
| DEVIN-REG10 | Regression | P2 | Devin | Rapid-toggle any switch 10× | No race; no XSS in config object/DOM attrs; CSRF token required. |
| DEVIN-E2E01 | E2E | P1 | Devin → session → PR | Set commit author = "Co-authored (Devin+you)" + Open PRs as = User → run session → open PR | PR authored/committed per settings; co-author trailer present. |
