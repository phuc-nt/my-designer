#!/bin/bash
# Stills of the composition at the given seconds, as contact sheets to read.
#   bash scripts/snap.sh <name> <t1,t2,...>        -> snapshots/<name>/contact-sheet-*.jpg
#   bash scripts/snap.sh mid  "$(node scripts/frame-times.mjs mid)"
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:-}"; times="${2:-}"
case "$name" in ""|*/*|.*) echo "usage: snap.sh <name> <t1,t2,...>" >&2; exit 2 ;; esac
[ -n "$times" ] || { echo "usage: snap.sh <name> <t1,t2,...>" >&2; exit 2; }
hf() { if command -v hyperframes >/dev/null; then hyperframes "$@"; else npx -y hyperframes "$@"; fi; }
rm -rf "snapshots/$name"
hf snapshot --at "$times" --no-end --describe false -o "snapshots/$name" 2>&1 | tail -3
ls "snapshots/$name"
