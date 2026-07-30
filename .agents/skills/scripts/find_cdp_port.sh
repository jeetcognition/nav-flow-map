#!/usr/bin/env bash
# Detect the CDP port of the already-running Chrome and verify it responds.
# Usage: ./find_cdp_port.sh   -> prints "http://127.0.0.1:<port>"
set -euo pipefail

DATA_DIR="${BROWSER_DATA_DIR:-/home/ubuntu/.browser_data_dir}"
PORT_FILE="$DATA_DIR/DevToolsActivePort"

if [[ -f "$PORT_FILE" ]]; then
  PORT="$(head -n1 "$PORT_FILE")"
else
  # Fallback scan
  for p in 41851 9222 29229; do
    if curl -sf "http://127.0.0.1:$p/json/version" >/dev/null 2>&1; then
      PORT="$p"; break
    fi
  done
fi

if [[ -z "${PORT:-}" ]]; then
  echo "ERROR: could not find CDP port (is Chrome running?)" >&2
  exit 1
fi

# Verify it responds
if curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
  echo "http://127.0.0.1:$PORT"
else
  echo "ERROR: port $PORT found but CDP endpoint not responding" >&2
  exit 1
fi
