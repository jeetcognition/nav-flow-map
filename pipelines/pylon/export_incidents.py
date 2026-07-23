"""Export classified Pylon tickets to the QA Command Center incidents fixture.

Applies QA-DEC-025 (deterministic classification) and the sanitization rule
for the public repo: no emails, no org slugs, no customer names — masked
customer handles and trimmed, redacted text only.

Usage:
    python3 export_incidents.py            # writes app fixture path if repo found
    python3 export_incidents.py --out X    # explicit output path
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from ticket_classifier import classify

HERE = Path(__file__).parent
# repo-relative: pipelines/pylon/ -> repo root -> app fixtures
DEFAULT_OUT = Path(__file__).resolve().parents[2] / "app/src/data/fixtures/incidents.json"

OPEN_STATES = {"new", "waiting_on_you", "on_hold"}
INVESTIGATING_STATES = {"waiting_on_customer"}
CLOSED_KEEP_DAYS = 14  # resolved incidents younger than this are kept
MAX_INCIDENTS = 200

# ---------------------------------------------------------------------------
# Sanitization — the fixture lands in a PUBLIC repo. Strip identities.
# ---------------------------------------------------------------------------
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
ORG_URL = re.compile(r"(app\.devin\.ai/org/)[\w-]+")
ENT_HOST = re.compile(r"https?://[\w-]+\.devinenterprise\.com[^\s\"']*")
SESSION_URL = re.compile(r"(app\.devin\.ai/sessions/)[\w-]+")
PHONE = re.compile(r"(\+?\d[\d ()./-]{7,}\d)")
BRACKET_SENDER = re.compile(r"^\s*\[[^\]]{1,60}\]\s*")  # "[user@x.com] " prefix
AGENT_TURNS = re.compile(r"\[Agent\].*", re.S)  # drop bot replies onward


def sanitize(text: str) -> str:
    t = html.unescape(text or "")
    t = AGENT_TURNS.sub("", t)
    t = BRACKET_SENDER.sub("", t)
    t = EMAIL.sub("•••@•••", t)
    t = ORG_URL.sub(r"\1•••", t)
    t = SESSION_URL.sub(r"\1•••", t)
    t = ENT_HOST.sub("https://•••.devinenterprise.com/•••", t)
    t = PHONE.sub("•••", t)
    return re.sub(r"\s+", " ", t).strip()


# ---------------------------------------------------------------------------
# Ticket → NavFlow node mapping (36 nodes; keyword table, first match wins).
# Tickets about the IDE/Desktop/billing don't have a natural node in the
# enterprise webapp map — they fall back to "landing" and say so in the
# rationale so the human can re-home them during verification.
# ---------------------------------------------------------------------------
NODE_KEYWORDS: list[tuple[str, str]] = [
    (r"\blog ?in\b|\bsign ?in\b|\blogin\b|\bsso\b|\bredirect\b", "login"),
    (r"\botp\b|verification code|\bauth(entication)?\b|\b2fa\b|locked out", "auth"),
    (r"\breview\b|pull request review", "review"),
    (r"\bwiki\b|deepwiki|read_wiki", "wiki"),
    (r"\bautomation", "automations"),
    (r"code.?scan|secure mode|security scan", "security"),
    (r"\b(membership|invite|roles?|groups?|idp|seats?)\b", "e-membership"),
    (r"organi[sz]ations?\b.*(create|delete|lost|missing)|sub.?org", "e-orgs"),
    (r"model (selection|toggle|dropdown)|capabilit(y|ies)|devin settings|byok", "e-devin"),
    (r"\bpreference|notification setting|profile|theme|git identity", "prefs"),
    (r"\bapi key|service user|devin api|personal access token|\bpat\b", "e-api"),
    (r"\bsecrets?\b|credentials?", "s-secrets"),
    (r"\bsessions?\b|composer|\bprompt\b|\bmcp\b|slack", "session"),
    (r"analytics|usage page|consumption", "my-analytics"),
    (r"settings", "ent"),
]


def map_node(text: str) -> tuple[str, bool]:
    low = text.lower()
    for pattern, node in NODE_KEYWORDS:
        if re.search(pattern, low):
            return node, True
    return "landing", False


def state_to_status(state: str) -> str:
    if state in OPEN_STATES:
        return "open"
    if state in INVESTIGATING_STATES:
        return "investigating"
    return "resolved"


def draft_testcase(title: str, desc: str, node: str) -> dict:
    return {
        "title": f"Regression: {title[:90]}",
        "nodeId": node,
        "priority": "P2",
        "preconditions": "Signed in with an account matching the affected customer profile.",
        "steps": f"Reproduce the reported scenario: {desc[:280]}",
        "expected": "The reported failure no longer occurs; behavior matches spec with no console or network errors.",
    }


def run(out_path: Path) -> None:
    conn = sqlite3.connect(HERE / "pylon_issues.db")
    conn.row_factory = sqlite3.Row
    rows = [dict(r) for r in conn.execute("SELECT * FROM issues ORDER BY created_at DESC")]

    cutoff = datetime.now(timezone.utc) - timedelta(days=CLOSED_KEEP_DAYS)
    incidents = []
    for r in rows:
        res = classify(r)
        if res["verdict"] == "not-app-issue":
            continue
        status = state_to_status(r["state"] or "closed")
        created = r["created_at"] or ""
        if status == "resolved":
            try:
                when = datetime.fromisoformat(created.replace("Z", "+00:00"))
            except ValueError:
                continue
            if when < cutoff:
                continue

        title = sanitize(r["title"] or "")[:140] or f"Pylon ticket #{r['number']}"
        desc = sanitize(r["body_snippet"] or "")[:300]
        node, mapped = map_node(f"{title} {desc}")
        rationale = (
            f"Rules: {', '.join(res['reasons'][:6])}"
            + ("" if mapped else " · node unmapped, defaulted to landing")
        )
        inc = {
            "id": f"INC-{r['number']}",
            "source": "pylon",
            "sourceLink": r["link"] or None,
            "verdict": res["verdict"],
            "title": title,
            "description": desc,
            "surfaceId": res["surface"],
            "nodeId": node,
            "severity": res["severity"],
            "status": status,
            "customer": f"Customer {int(r['number']) % 997:03d}•••",
            "createdAt": created,
            "ai": {
                "category": "app-bug",
                "confidence": res["confidence"],
                "rationale": rationale,
            },
            "humanCategory": None,
            "overriddenBy": None,
            "linkedBugId": None,
            "linkedCaseId": None,
        }
        if res["verdict"] == "definite-bug":
            inc["draftCase"] = draft_testcase(title, desc, node)
        incidents.append(inc)

    # Highest-signal first: open before resolved, then definite, then score.
    order = {"open": 0, "investigating": 1, "resolved": 2}
    incidents.sort(key=lambda i: (order[i["status"]], i["verdict"] != "definite-bug", i["id"]))
    dropped = len(incidents) - MAX_INCIDENTS
    incidents = incidents[:MAX_INCIDENTS]

    out_path.write_text(json.dumps(incidents, indent=1, ensure_ascii=False) + "\n")
    kept = len(incidents)
    by = {}
    for i in incidents:
        by[i["status"]] = by.get(i["status"], 0) + 1
    print(f"wrote {kept} incidents → {out_path}")
    print(f"  by status: {by}")
    print(f"  definite: {sum(1 for i in incidents if i['verdict'] == 'definite-bug')}")
    if dropped > 0:
        print(f"  dropped {dropped} lower-priority resolved incidents (cap {MAX_INCIDENTS})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    run(args.out)
