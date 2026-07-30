# Known quirks — do NOT refile these as bugs

Intentional weirdness, accepted limitations, and flag-gated gaps. Before filing a
bug, check here; if a finding matches a quirk, skip it. A "feature not found" is
usually flag-gated/not-deployed → send it to `memory/backlog.md`, not `bugs.json`.

| ID      | Surface             | Quirk                                                   | Why accepted                       |
| ------- | ------------------- | ------------------------------------------------------- | ---------------------------------- |
| QRK-001 | Git / GitLab        | "Configure webhook" is manual, no auto-register         | Intended UX; GitLab API constraint |
| QRK-002 | Git / Azure DevOps  | "Configure webhook" is manual, no auto-register         | Intended UX; ADO API constraint    |
| QRK-003 | Features            | Golden Snapshot feature not visible                     | Feature-flagged off                |
| QRK-004 | Billing             | Billing tab absent when ACU not enabled                 | ACU is an add-on                   |
| QRK-005 | Git / GitHub        | GitHub containers show a flat list, no nesting          | GitHub containers don't nest       |
| QRK-006 | Console (all pages) | "A VideoFrame was garbage collected…" WebCodecs warning | Cosmetic; not a functional error   |

<!-- Template: | QRK-NNN | Surface | Quirk | Why accepted | -->
