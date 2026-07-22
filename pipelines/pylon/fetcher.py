"""Incremental Pylon API fetcher with backfill support."""
from __future__ import annotations

import os
import json
import subprocess
from datetime import datetime, timedelta, timezone

from db import init_db, upsert_issues, log_fetch, get_last_fetch_time, get_issue_count

PYLON_API_KEY = os.environ.get("PYLON_API_KEY", "")
PYLON_BASE_URL = "https://api.usepylon.com/issues"
BACKFILL_DAYS = 60


def fetch_issues(start_time: str, end_time: str) -> list[dict]:
    """Fetch issues from Pylon API for a given time range."""
    url = f"{PYLON_BASE_URL}?start_time={start_time}&end_time={end_time}"
    
    result = subprocess.run(
        ["curl", "-s", "--max-time", "60", url,
         "-H", f"Authorization: Bearer {PYLON_API_KEY}"],
        capture_output=True, text=True
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"curl failed with code {result.returncode}: {result.stderr}")
    
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON response: {e}\nResponse: {result.stdout[:500]}")
    
    if "errors" in data:
        raise RuntimeError(f"API error: {data['errors']}")
    
    return data.get("data", [])


def incremental_fetch() -> int:
    """Fetch only new issues since last fetch. Returns count of new issues."""
    last_fetch = get_last_fetch_time()
    now = datetime.now(timezone.utc)
    
    if last_fetch:
        # Fetch from last fetch time to now (with 1h overlap for safety)
        start = datetime.fromisoformat(last_fetch.replace("Z", "+00:00")) - timedelta(hours=1)
    else:
        # No previous fetch — just get last 24h (backfill separately)
        start = now - timedelta(hours=24)
    
    start_str = start.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    print(f"Incremental fetch: {start_str} → {end_str}")
    issues = fetch_issues(start_str, end_str)
    print(f"  Fetched {len(issues)} issues")
    
    if issues:
        upsert_issues(issues)
        log_fetch(start_str, end_str, len(issues))
    
    return len(issues)


def backfill(days: int = BACKFILL_DAYS) -> int:
    """Backfill historical data by fetching day-by-day. Used on first run."""
    now = datetime.now(timezone.utc)
    total = 0
    
    print(f"Backfilling {days} days of history...")
    for i in range(days):
        day_end = now - timedelta(days=i)
        day_start = day_end - timedelta(days=1)
        start_str = day_start.strftime("%Y-%m-%dT%H:%M:%SZ")
        end_str = day_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        print(f"  Day {i+1}/{days}: {start_str} → {end_str}", end="", flush=True)
        issues = fetch_issues(start_str, end_str)
        print(f" → {len(issues)} issues")
        
        if issues:
            upsert_issues(issues)
            log_fetch(start_str, end_str, len(issues))
            total += len(issues)
    
    return total


def smart_fetch() -> dict:
    """
    Intelligent fetch strategy:
    - If DB is empty → full 14-day backfill
    - If DB has data → incremental 24h fetch
    Returns stats about what was done.
    """
    init_db()
    current_count = get_issue_count()
    
    if current_count == 0:
        print("Empty database — performing full backfill...")
        count = backfill()
        return {"action": "backfill", "issues_fetched": count, "total_in_db": get_issue_count()}
    else:
        print(f"Database has {current_count} issues — performing incremental fetch...")
        count = incremental_fetch()
        return {"action": "incremental", "issues_fetched": count, "total_in_db": get_issue_count()}


if __name__ == "__main__":
    if not PYLON_API_KEY:
        print("ERROR: PYLON_API_KEY environment variable not set")
        print("Set it with: export PYLON_API_KEY='<pylon-api-key>'")
        exit(1)
    
    result = smart_fetch()
    print(f"\nFetch complete: {result}")
