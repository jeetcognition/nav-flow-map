"""Pattern engine: cluster classified tickets into coverage-gap patterns.

Implements steps 4-8 of the combined intake flow (docs/decisions.md QA-DEC-027):
tickets that the deterministic classifier (QA-DEC-025) judged definite-bug or
possible-bug are grouped into patterns (union-find over normalized titles,
error signatures, and token overlap), ranked by impact x growth, joined with
the committed coverage ledger (coverage.json), and given a concrete suggested
test. Adapted from the ent-qa/pylon-report-parser graph engine.

Pattern "memory" is DERIVED from the 60-day ticket window on every run
(first_seen = oldest member ticket, growth = last 24h vs previous 24h), so no
mutable state has to survive between CI runs. The only real state is human
feedback, which lives in the committed, sanitized coverage.json ledger.

No LLM anywhere in this path. Pylon is never written to.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

from pattern_headlines import excerpt, headline, is_generic

COVERAGE_PATH = Path(__file__).parent / "coverage.json"
COVERAGE_STATUSES = {"uncovered", "weak", "covered", "dismissed"}
OPEN_STATES = {"new", "waiting_on_you", "on_hold"}

# Flow rules — ORDER-free: every issue is scored against ALL groups and the
# best match (hits x keyword specificity) wins, so specific beats broad.
FLOW_RULES: list[tuple[str, list[str]]] = [
    ("Review/GitHub", ["devin review", "github", "pull request", "pr creation", "citation", "azure devops"]),
    ("CLI", ["devin cli", " cli ", "terminal", "command line"]),
    ("Permissions/Rate limits", ["permission denied", "rate limit", "access denied", "unauthorized", "forbidden"]),
    ("Files/Attachments", ["upload", "uploaded file", "attachment"]),
    ("IDE/Desktop", ["windsurf", "cascade", "intellij", "editor", "autocomplete", "vscode", "vs code", "desktop"]),
    ("Login/Auth", ["login", "sso", "sign in", "password", "authenticate", "verification code", "otp", "2fa"]),
    ("Sessions/Automation", ["session", "schedule", "automation", "workspace", "playbook"]),
    ("Onboarding/Setup", ["setting up", "setup", "first run", "getting started", "onboarding", "install"]),
    ("Quota/Usage", ["quota", "usage", "credits", "acu", "usage limit"]),
    ("Billing/Account", ["payment", "billing", "charge", "invoice", "stripe", "subscription", "upgrade", "plan", "seat"]),
]

FLOW_WEIGHT = {
    "Billing/Account": 24, "Login/Auth": 20, "Permissions/Rate limits": 22,
    "Sessions/Automation": 18, "CLI": 22, "IDE/Desktop": 16, "Review/GitHub": 18,
    "Files/Attachments": 12, "Onboarding/Setup": 16, "Quota/Usage": 20, "Other": 4,
}

STOP = {
    "the", "and", "for", "with", "this", "that", "have", "has", "are", "was", "were",
    "from", "your", "you", "but", "not", "can", "cannot", "issue", "error", "hello",
    "dear", "team", "support", "please", "need", "help", "getting", "using", "when",
    "after", "before", "about", "into", "able", "unable",
}

# Language-agnostic error signatures: ids, codes, and stack shapes read the
# same in every language, so non-English tickets can still join a pattern.
SIG_PATTERNS = [
    r"permission denied[^.\n]{0,60}", r"err_[a-z_]+", r"\b(4\d\d|5\d\d) (error|status)\b",
    r"trace ?id[:\s]+[a-z0-9-]+", r"payment failed", r"rate limit[^.\n]{0,40}",
    r"\b[A-Z]{4,}-\d{3,}\b", r"traceback \(most recent call last\)",
]


def _text(r: dict) -> str:
    return f"{r.get('title') or ''} {r.get('body_snippet') or ''}".lower()


def flow_of(r: dict) -> str:
    t = _text(r)
    best, best_score = "Other", 0.0
    for name, kws in FLOW_RULES:
        hits = [k for k in kws if k in t]
        if hits:
            score = len(hits) * (sum(len(k) for k in hits) / len(hits))
            if score > best_score:
                best, best_score = name, score
    return best


def norm_title(r: dict) -> str:
    t = (r.get("title") or "").lower()
    t = re.sub(r"[\w.-]+@[\w.-]+", "", t)
    t = re.sub(r"[0-9a-f]{8,}", "", t)
    t = re.sub(r"https?://\S+", "", t)
    t = re.sub(r"[^a-z\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()[:80]


def tokens_of(r: dict) -> set[str]:
    return {w for w in re.findall(r"[a-z]{4,}", _text(r)) if w not in STOP}


def error_sig(r: dict) -> str:
    t = _text(r)
    for pat in SIG_PATTERNS:
        m = re.search(pat, t, re.I)
        if m:
            return re.sub(r"[a-f0-9]{8,}", "<id>", m.group(0))[:90]
    return ""


class DSU:
    def __init__(self, items: list[str]):
        self.p = {x: x for x in items}

    def find(self, x: str) -> str:
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a: str, b: str) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[rb] = ra


def cluster(rows: list[dict]) -> list[list[dict]]:
    """Union-find clustering: shared (surface, flow, norm-title/error-sig) keys,
    then token-Jaccard within each surface+flow bucket."""
    for r in rows:
        r["_flow"] = flow_of(r)
        r["_norm"] = norm_title(r)
        r["_sig"] = error_sig(r)
        r["_tokens"] = tokens_of(r)
    dsu = DSU([r["id"] for r in rows])
    by_key: dict[tuple, list[str]] = defaultdict(list)
    for r in rows:
        keys = [(r["_surface"], r["_flow"], r["_norm"])]
        if r["_sig"]:
            keys.append((r["_surface"], r["_flow"], r["_sig"]))
        for key in keys:
            if key[2] and len(key[2]) >= 5:
                by_key[key].append(r["id"])
    for ids in by_key.values():
        for x in ids[1:]:
            dsu.union(ids[0], x)

    buckets: dict[tuple, list[dict]] = defaultdict(list)
    for r in rows:
        buckets[(r["_surface"], r["_flow"])].append(r)
    for arr in buckets.values():
        if len(arr) > 250:
            continue
        for i, a in enumerate(arr):
            for b in arr[i + 1:]:
                inter = len(a["_tokens"] & b["_tokens"])
                union_size = len(a["_tokens"] | b["_tokens"]) or 1
                if inter >= 4 and inter / union_size >= 0.48:
                    dsu.union(a["id"], b["id"])

    groups: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        groups[dsu.find(r["id"])].append(r)
    return list(groups.values())


SUGGESTED_TESTS = {
    "Billing/Account": "Complete a Stripe test payment / plan change → verify account state and plan badge update within 30s → verify no stale entitlement",
    "Login/Auth": "Attempt login via SSO and email+OTP → verify redirect completes and a session is established → verify no redirect loop or rejected code",
    "Permissions/Rate limits": "Perform 20 standard user actions in 60s → verify zero false permission/rate-limit blocks → verify error messages are actionable",
    "Sessions/Automation": "Create a scheduled task 5 min out → restart the workspace → verify the schedule still fires and history records the run",
    "CLI": "Fresh install on a clean machine → run first command → verify response (or a clear error) within 10s, no hang",
    "IDE/Desktop": "Open the IDE → exercise chat + autocomplete for 5 min → verify responses keep arriving with no crash or freeze",
    "Review/GitHub": "Open a PR with review enabled → verify comments post and every citation link scrolls to the cited range",
    "Files/Attachments": "Upload txt, png, and pdf → reference each in a prompt → verify the agent reads all three",
    "Quota/Usage": "Record ACU balance → run a short session → verify the deduction matches expected usage",
    "Onboarding/Setup": "Create a new org → complete the setup wizard → verify transition out of 'setting up' within 60s",
    "Other": "Reproduce the reported scenario end-to-end → verify correct behavior and no console/network errors",
}


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _cluster_key(items: list[dict], flow: str) -> str:
    """The raw signature a cluster formed around — the pattern's stable identity."""
    top = max(items, key=lambda r: r["_score"])
    key = top["_sig"] or top["_norm"] or (top.get("title") or "")[:80].lower()
    return key if len(key.strip()) >= 5 else flow.lower()


def build_patterns(rows: list[dict], now: datetime | None = None) -> list[dict]:
    """rows: classified tickets (verdict + surface already attached by caller
    as _verdict/_surface/_score). Returns ranked pattern dicts (unsanitized)."""
    now = now or datetime.now(timezone.utc)
    cut24, cut48 = _iso(now - timedelta(hours=24)), _iso(now - timedelta(hours=48))
    coverage = load_coverage()

    # Two clusters formed around different keys can still tell the same human
    # story — merge those (same surface+flow+SPECIFIC headline), like the
    # upstream report parser. Clusters that only share a GENERIC fallback
    # headline are different stories: they stay separate and get a
    # distinguishing excerpt appended so rows never render identically.
    merged: dict[tuple, list[dict]] = {}
    for items in cluster(rows):
        flow = Counter(r["_flow"] for r in items).most_common(1)[0][0]
        surface = Counter(r["_surface"] for r in items).most_common(1)[0][0]
        key = _cluster_key(items, flow)
        h = headline(items, flow, key)
        bucket = (surface, flow, h) if not is_generic(h) else (surface, flow, h, key)
        merged.setdefault(bucket, []).extend(items)

    patterns = []
    for bucket, items in merged.items():
        surface, flow, h = bucket[0], bucket[1], bucket[2]
        # identity stays keyed on the raw error-sig/norm-title, so coverage
        # ledger entries survive future headline-wording tweaks
        key = _cluster_key(items, flow)
        label = h if not is_generic(h) else f"{h} · “{excerpt(items, key, flow)}”"
        pid = hashlib.sha1(f"{surface}|{flow}|{key}".encode()).hexdigest()[:12]

        created = sorted(r.get("created_at") or "" for r in items)
        count24 = sum(1 for r in items if (r.get("created_at") or "") >= cut24)
        prev24 = sum(1 for r in items if cut48 <= (r.get("created_at") or "") < cut24)
        open_ct = sum(1 for r in items if (r.get("state") or "") in OPEN_STATES)
        definite = sum(1 for r in items if r["_verdict"] == "definite-bug")

        score = (
            max(r["_score"] for r in items) * 8
            + 12 * math.log2(len(items) + 1)
            + FLOW_WEIGHT.get(flow, 4)
            + 10 * count24
            + 5 * open_ct
            + 6 * definite
        )
        cov = coverage.get(pid, {})
        patterns.append({
            "id": pid,
            "surface": surface,
            "flow": flow,
            "label": label,
            "items": items,
            "total": len(items),
            "open": open_ct,
            "definite": definite,
            "count24h": count24,
            "growth24h": count24 - prev24,
            "firstSeen": created[0] if created and created[0] else _iso(now),
            "score": round(score, 1),
            "suggestedTest": SUGGESTED_TESTS.get(flow, SUGGESTED_TESTS["Other"]),
            "coverage": cov.get("status", "uncovered"),
            "coveredBy": cov.get("coveredBy"),
        })

    patterns.sort(key=lambda p: -p["score"])
    return patterns


def load_coverage() -> dict:
    """Committed human-feedback ledger: {pattern_id: {status, coveredBy, notes,
    by, updatedAt}}. Unknown statuses are treated as uncovered (fail open)."""
    if not COVERAGE_PATH.exists():
        return {}
    data = json.loads(COVERAGE_PATH.read_text())
    return {
        k: v for k, v in data.items()
        if isinstance(v, dict) and v.get("status") in COVERAGE_STATUSES
    }
