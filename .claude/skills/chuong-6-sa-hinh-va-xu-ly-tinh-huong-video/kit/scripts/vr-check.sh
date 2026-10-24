#!/bin/bash
# Pixel regression of the whole composition: stills at fixed seconds, diffed against a baseline with
# `ui vr gate` (ease-design, a devDependency of my-designer). Use it to prove a kit change left a video as it was.
#   bash scripts/vr-check.sh base  <t1,t2,...>   -> snapshots/vr-base/at-*.png  (once, before changing the kit)
#   bash scripts/vr-check.sh check <t1,t2,...>   -> snapshots/vr-now/, diff PNGs in snapshots/vr-diff/; exit 1 on a change
# Stills use SwiftShader (--no-browser-gpu) so two runs on one machine give the same pixels.
# Exit 3 when `ui` is not installed (a build without npm): say "not verified" in the report.
set -euo pipefail
cd "$(dirname "$0")/.."
mode="${1:-}"; times="${2:-}"
case "$mode" in base|check) ;; *) echo "usage: vr-check.sh base|check <t1,t2,...>" >&2; exit 2 ;; esac
[ -n "$times" ] || { echo "usage: vr-check.sh base|check <t1,t2,...>" >&2; exit 2; }
root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
ui="${UI:-$root/node_modules/.bin/ui}"
[ -x "$ui" ] || { echo "ui not found at $ui: pixel check skipped (not verified)" >&2; exit 3; }
hf() { if command -v hyperframes >/dev/null; then hyperframes "$@"; else npx -y hyperframes "$@"; fi; }
dir=snapshots/vr-now; [ "$mode" = base ] && dir=snapshots/vr-base
rm -rf "$dir"
hf snapshot --at "$times" --no-end --keep --no-browser-gpu --describe false -o "$dir" 2>&1 | tail -1
if [ "$mode" = base ]; then ls "$dir"; exit 0; fi
[ -d snapshots/vr-base ] || { echo "no baseline: run 'vr-check.sh base' on the old kit first" >&2; exit 2; }
rm -rf snapshots/vr-diff
"$ui" vr gate snapshots/vr-base "$dir" --out-dir snapshots/vr-diff
