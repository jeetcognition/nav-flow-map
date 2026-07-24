# Agent skills

Model-invocable skills for QA of the app under test. Discovered automatically by
Devin; invoke by name. Both browser skills drive an **already-authenticated**
Chrome via Playwright-CDP — they never launch a new browser or fetch an OTP.

| Skill                                             | When to use                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`exploratory-qa`](exploratory-qa/SKILL.md)       | Open-ended bug hunting / regression / smoke passes / reproduce a reported bug / verify a changelog. |
| [`desktop-qa-runner`](desktop-qa-runner/SKILL.md) | Run specific catalog case IDs deterministically and record pass/fail/skip.                          |

Shared CDP helpers live in [`scripts/`](scripts/). The methodology and durable
memory these skills read/write live in [`../../qa-loop/`](../../qa-loop/README.md).
