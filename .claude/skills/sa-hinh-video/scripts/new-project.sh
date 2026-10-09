#!/bin/bash
# Start a sa hình video project in videos/<name>: a HyperFrames project, the Vietnamese fonts, the
# glass-keynote design, and the kit of this skill (3D engine, models, overlay kit, scripts).
# With --example, the per-video files of a finished video are copied too, as the starting point.
#   bash .claude/skills/sa-hinh-video/scripts/new-project.sh <name> [--example v02-nga-tu-co-bien]
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
SK="$ROOT/.claude/skills/vi-explainer-video"
name="${1:-}"; example=""
[ "${2:-}" = "--example" ] && example="${3:-}"
case "$name" in ""|*/*|.*|-*) echo "usage: new-project.sh <name> [--example <example>]" >&2; exit 2 ;; esac
P="$ROOT/videos/$name"
[ -e "$P" ] && { echo "videos/$name already exists" >&2; exit 1; }
if [ -n "$example" ] && [ ! -d "$HERE/examples/$example" ]; then
  echo "no such example: $example (have: $(ls "$HERE/examples" | tr '\n' ' '))" >&2; exit 1
fi
HF=""
for d in "$ROOT/.kiro/skills" "$ROOT/.claude/skills" "$HOME/.claude/skills"; do [ -d "$d/faceless-explainer" ] && { HF="$d"; break; }; done
[ -n "$HF" ] || { echo "the HyperFrames skills (faceless-explainer) are not installed; see vi-explainer-video/references/install.md" >&2; exit 1; }
hf() { if command -v hyperframes >/dev/null; then hyperframes "$@"; else npx -y hyperframes "$@"; fi; }

mkdir -p "$ROOT/videos"
(cd "$ROOT/videos" && hf init "$name" --non-interactive --example=blank --skill=faceless-explainer) | tail -2
cd "$P"
mkdir -p assets/fonts
cp "$SK"/assets/fonts/*.woff2 assets/fonts/
node "$HF/faceless-explainer/scripts/build-frame.mjs" --preset glass-keynote --preset-dir "$SK/presets" --hyperframes . | tail -1
cp -R "$HERE/kit/." .
if [ -n "$example" ]; then
  cp -R "$HERE/examples/$example/." .
fi
echo "project: videos/$name"
echo "HF: $HF"
[ -n "$example" ] && echo "example: $example (BRIEF.md, SCRIPT.md, requests, plan/roads/sites/beats, build-frames, build-storyboard)"
echo "next: SKILL.md step 3"
