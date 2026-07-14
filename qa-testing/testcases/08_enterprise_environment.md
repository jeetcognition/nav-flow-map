# 08 — Enterprise Environment (Blueprints / Snapshots / Golden / Upkeep / Builds)

PRD §4 (Environment). Page: `/org/cog-enterprise-qa/settings/enterprise-environment` (tabs: Configuration, Blueprint, Snapshots, Golden snapshot (legacy), Upkeep, Builds).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ENV-SMK01 | Smoke | P1 | Enterprise settings → Environment | Load | Renders "Environment"; tabs Configuration/Blueprint/Snapshots/Golden snapshot (legacy) present; no console errors. |
| ENV-SAN01 | Sanity | P2 | Environment | Switch each tab (`?tab=configuration/blueprint/snapshots/...`) | Content swaps; deep-link restores tab. |
| ENV-REG01 | Regression | P2 | Environment → Configuration | **Max concurrent builds**: enter -5, 0, 2.5, 100000, `abc`, empty | **BL-044**: accepts -5/0/2.5/huge client-side (no inline validation); `abc` stripped; Save stays disabled → invalid-persistence unconfirmed. Expected: inline validation + server rejects invalid. |
| ENV-REG02 | Regression | P2 | Environment → Blueprint | Edit blueprint YAML: valid, malformed YAML, huge file | Valid saves + builds snapshot; malformed shows parse error; no crash. |
| ENV-REG03 | Regression | P2 | Environment → Snapshots | Enable **override**; set schedule | Override reveals controls; schedule persists. |
| ENV-REG04 | Regression | P3 | Environment → Golden snapshot (legacy) | Load tab | Renders legacy notice/config; no crash. |
| ENV-REG05 | Regression | P2 | Environment → Upkeep | Load Upkeep tab | **Known BUG-013**: `/api/beta/` call returns 404 (page renders but API fails). Expected: 200. |
| ENV-REG06 | Regression | P2 | Environment → Builds | Load build history | Builds list renders with status/timestamps; failed builds show logs. |
| ENV-E2E01 | E2E | P2 | Environment → session | Edit org blueprint (add install step) → build snapshot → start session | Session boots from new snapshot with tooling present. |
