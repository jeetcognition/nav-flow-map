# 08 — Enterprise Environment (Blueprints / Snapshots / Golden / Upkeep / Builds)

PRD §4 (Environment). Page: `/org/cog-enterprise-qa/settings/enterprise-environment` (tabs: Configuration, Blueprint, Snapshots, Golden snapshot (legacy), Upkeep, Builds).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ENV-SMK01 | Smoke | P1 | Settings → Environment | Load cold. | Configuration, Blueprint, Outposts, Golden snapshot, Snapshots, and Steering knowledge surfaces render without page errors. |
| ENV-SAN01 | Sanity | P1 | Environment | Switch each tab and deep-link/refresh it. | Selected tab content and URL state are consistent; invalid tab falls back safely. |
| ENV-SAN02 | Sanity | P1 | Environment → Snapshots/Steering knowledge | Inspect tables, search fields, filters, and pagination. | Version/history/snapshot rows and steering knowledge rows are readable; search and filters do not hide critical status context. |
| ENV-REG01 | Regression | P1 | Environment → Configuration | Test organization/repository selection and required configuration controls without saving. | Save/start actions are gated until valid selections exist; helper text identifies what will be affected. |
| ENV-REG02 | Regression | P1 | Environment → Blueprint | Edit disposable blueprint text with valid YAML, malformed YAML, huge content, Unicode, and HTML-like text; discard or restore. | Parser/validation errors are clear; unsafe text is inert; no invalid blueprint is saved. |
| ENV-REG03 | Regression | P1 | Environment → Outposts | Inspect outpost configuration/list/empty states and available actions. | Outpost state, ownership, and disabled controls are clear; no unrelated tenant data appears. |
| ENV-REG04 | Regression | P1 | Environment → Golden snapshot | Inspect legacy snapshot controls and warnings without changing state. | Legacy status and migration/usage guidance are clear; unavailable actions are safely disabled. |
| ENV-REG05 | Regression | P1 | Environment → Snapshots | Search snapshot/version history by script/repo/user/status with no-match and special text. | Filtering is literal and safe; row counts/statuses remain accurate; no stale data is shown after filter changes. |
| ENV-REG06 | Regression | P1 | Environment → build/reset actions | With approval only, start/reset/build a disposable environment operation and monitor result/logs. | Operation status progresses clearly; failures expose logs without secrets; cleanup/rollback guidance is available. |
| ENV-REG07 | Regression | P0 | Environment | As non-admin or with tampered org/repo/snapshot IDs, attempt to read or mutate environment config. | Authorization denies unauthorized access; blueprint contents, secrets, and logs are not leaked cross-tenant. |
| ENV-E2E01 | E2E | P1 | Environment → new session | With approval, apply a minimal disposable blueprint change, build snapshot, start a session, then restore. | New session reflects the snapshot/config exactly; cleanup returns blueprint/snapshot configuration to original state. |
