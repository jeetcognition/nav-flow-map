"""SQLite storage layer for Pylon issues with 14-day rolling window."""
from __future__ import annotations

import sqlite3
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "pylon_issues.db"
RETENTION_DAYS = 60


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS issues (
            id TEXT PRIMARY KEY,
            number INTEGER,
            title TEXT,
            state TEXT,
            source TEXT,
            brand TEXT,
            priority TEXT,
            question_type TEXT,
            plan_tier TEXT,
            tags TEXT,  -- JSON array
            link TEXT,
            created_at TEXT,
            updated_at TEXT,
            resolution_seconds INTEGER,
            first_response_seconds INTEGER,
            body_snippet TEXT,  -- first 500 chars of body for pattern matching
            raw_json TEXT,  -- full issue JSON for future analysis
            fetched_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
        CREATE INDEX IF NOT EXISTS idx_issues_state ON issues(state);
        CREATE INDEX IF NOT EXISTS idx_issues_question_type ON issues(question_type);
        CREATE INDEX IF NOT EXISTS idx_issues_brand ON issues(brand);
        CREATE INDEX IF NOT EXISTS idx_issues_plan_tier ON issues(plan_tier);

        CREATE TABLE IF NOT EXISTS fetch_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time TEXT,
            end_time TEXT,
            issues_fetched INTEGER,
            fetched_at TEXT DEFAULT (datetime('now'))
        );

        -- Temporal pattern tracking: daily snapshot of each cluster's size
        CREATE TABLE IF NOT EXISTS pattern_history (
            report_date TEXT,
            cluster_id TEXT,
            product TEXT,
            flow TEXT,
            label TEXT,
            issue_count INTEGER,
            open_count INTEGER,
            growth_rate REAL,  -- issues added per day (7d average)
            first_seen TEXT,   -- date this cluster first appeared
            PRIMARY KEY(report_date, cluster_id)
        );

        CREATE INDEX IF NOT EXISTS idx_pattern_history_cluster
            ON pattern_history(cluster_id);

        -- Coverage mapping: is this pattern covered by existing QA?
        CREATE TABLE IF NOT EXISTS coverage_map (
            cluster_id TEXT PRIMARY KEY,
            product TEXT,
            flow TEXT,
            label TEXT,
            status TEXT DEFAULT 'uncovered',  -- uncovered, weak, covered
            covered_by TEXT,       -- test ID or description
            covered_at TEXT,       -- when marked covered
            notes TEXT,
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- Suggested tests generated from patterns
        CREATE TABLE IF NOT EXISTS suggested_tests (
            id TEXT PRIMARY KEY,
            cluster_id TEXT,
            product TEXT,
            user_flow TEXT,        -- the workflow that breaks
            test_description TEXT, -- what test to write
            evidence TEXT,         -- JSON array of pylon ticket numbers
            priority_reason TEXT,
            status TEXT DEFAULT 'suggested',  -- suggested, accepted, implemented, dismissed
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()


def upsert_issues(issues: list[dict]):
    """Insert or update issues in the database."""
    conn = get_connection()
    for issue in issues:
        cf = issue.get("custom_fields", {}) or {}
        
        # Extract brand
        brand_field = cf.get("brand", {})
        brand = brand_field.get("value", "") if isinstance(brand_field, dict) else ""
        
        # Extract priority
        prio_field = cf.get("priority", {})
        priority = prio_field.get("value", "") if isinstance(prio_field, dict) else ""
        
        # Extract question_type
        qt_field = cf.get("question_type", {})
        if isinstance(qt_field, dict):
            vals = qt_field.get("values", [])
            question_type = vals[0] if vals else qt_field.get("value", "")
        else:
            question_type = ""
        
        # Extract plan tier from tags
        tags = issue.get("tags") or []
        plan_tags = [t for t in tags if t.startswith("plan:")]
        plan_tier = plan_tags[0].replace("plan:", "") if plan_tags else ""
        
        # Body snippet (strip HTML, take first 500 chars)
        import re
        body_html = issue.get("body_html", "") or ""
        body_text = re.sub(r'<[^>]+>', ' ', body_html)
        body_snippet = body_text[:500]
        
        conn.execute("""
            INSERT INTO issues (id, number, title, state, source, brand, priority,
                              question_type, plan_tier, tags, link, created_at, updated_at,
                              resolution_seconds, first_response_seconds, body_snippet, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                state = excluded.state,
                updated_at = excluded.updated_at,
                resolution_seconds = excluded.resolution_seconds,
                first_response_seconds = excluded.first_response_seconds,
                fetched_at = datetime('now')
        """, (
            issue["id"],
            issue.get("number"),
            issue.get("title", ""),
            issue.get("state", ""),
            issue.get("source", ""),
            brand,
            priority,
            question_type,
            plan_tier,
            json.dumps(tags),
            issue.get("link", ""),
            issue.get("created_at", ""),
            issue.get("updated_at", ""),
            issue.get("resolution_seconds"),
            issue.get("first_response_seconds"),
            body_snippet,
            json.dumps(issue),
        ))
    
    conn.commit()
    conn.close()


def log_fetch(start_time: str, end_time: str, count: int):
    """Log a successful fetch."""
    conn = get_connection()
    conn.execute(
        "INSERT INTO fetch_log (start_time, end_time, issues_fetched) VALUES (?, ?, ?)",
        (start_time, end_time, count)
    )
    conn.commit()
    conn.close()


def get_last_fetch_time() -> str | None:
    """Get the end_time of the most recent fetch."""
    conn = get_connection()
    row = conn.execute(
        "SELECT end_time FROM fetch_log ORDER BY fetched_at DESC LIMIT 1"
    ).fetchone()
    conn.close()
    return row["end_time"] if row else None


def cleanup_old_issues():
    """Remove issues older than RETENTION_DAYS."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    conn = get_connection()
    result = conn.execute("DELETE FROM issues WHERE created_at < ?", (cutoff,))
    deleted = result.rowcount
    conn.commit()
    conn.close()
    return deleted


def get_bugs_last_24h() -> list[dict]:
    """Get all bugs from the last 24 hours."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM issues 
        WHERE question_type = 'bug' AND created_at >= ?
        ORDER BY created_at DESC
    """, (cutoff,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_bugs_in_window() -> list[dict]:
    """Get all bugs within the retention window."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM issues 
        WHERE question_type = 'bug' AND created_at >= ?
        ORDER BY created_at DESC
    """, (cutoff,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_issues_in_window() -> list[dict]:
    """Get all issues within the retention window."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)).isoformat()
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM issues WHERE created_at >= ?
        ORDER BY created_at DESC
    """, (cutoff,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_issue_count() -> int:
    """Get total issue count in the database."""
    conn = get_connection()
    row = conn.execute("SELECT COUNT(*) as cnt FROM issues").fetchone()
    conn.close()
    return row["cnt"]


def get_daily_bug_counts(days: int = 7) -> dict[str, int]:
    """Get bug counts per day for the last N days."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    conn = get_connection()
    rows = conn.execute("""
        SELECT DATE(created_at) as day, COUNT(*) as cnt
        FROM issues
        WHERE question_type = 'bug' AND created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY day
    """, (cutoff,)).fetchall()
    conn.close()
    return {row["day"]: row["cnt"] for row in rows}
