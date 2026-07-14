# 19 — Docs: Introducing Devin

Imported from Notion: Devin Enterprise — QA Test Cases (sub-page 19).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| DIN-SMK01 | Smoke | P1 | Open doc URL | Load cold | Renders title "Introducing Devin", intro video `<Frame>`, TOC (Get Started Now, Strengths, Product Features, Getting Access, Feedback, Demo, About). No console errors. |
| DIN-SMK02 | Smoke | P2 | On page | Play the "prompt to PR" MP4 + the tools MP4 + YouTube demo iframe | All media load and play; no CORS/mixed-content errors. |
| DIN-SAN01 | Sanity | P2 | On page | Click every in-body link (release notes, environment setup, CLI, best practices, knowledge, gallery, Slack/Teams, api-reference, session-tools, app.devin.ai, mailto, blog) | Each 200 / opens correctly; no 404. |
| DIN-REG01 | Regression | P2 | "General Product Features → The Devin Interface" | Verify the 3 tool cards (Shell, IDE, Browser) match actual session tools | Matches product (suite 02 STOOL-\*). |
| DIN-REG02 | Regression | P2 | "Getting Access" | Copy the install one-liner \`curl -fsSL https://cli.devin.ai/install.sh \\ | bash\` |
| DIN-REG03 | Regression | P3 | "Strengths" lists | Sanity-read the 4 strength groups + best-practice tips | Content coherent; internal links valid. |
| DIN-REG04 | Regression | P2 | Feedback section | Click "Feedback" flow references (Slack Connect, support mail, in-app Feedback button) | Links valid; in-app Feedback button exists in web app. |
| DIN-E2E01 | E2E | P2 | New-user path | From this page: sign up at app.devin.ai → start first session (prompt→PR) following the described flow | A new user reaches a first successful session using only doc guidance; each linked "Get Started" tip is reachable and accurate. |
