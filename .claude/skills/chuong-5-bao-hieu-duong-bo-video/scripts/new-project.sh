#!/bin/bash
# Start a video of the "Báo hiệu đường bộ" chapter in videos/<name>: a HyperFrames project, the
# Vietnamese fonts, the glass-keynote design, cue reading, assembly and checks (taken from the
# chuong-6-sa-hinh-va-xu-ly-tinh-huong-video kit), the street, the signs, the vehicles and the overlay kit of this skill, and the per-lesson
# files of a finished lesson as the starting point.
#   bash .claude/skills/chuong-5-bao-hieu-duong-bo-video/scripts/new-project.sh <name> [--example bai-01-bien-cam-o-to-va-bien-cam-mo-to | --bare]
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
SK="$ROOT/.claude/skills/vi-explainer-video"
ENGINE="$ROOT/.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit"
name="${1:-}"; example="bai-01-bien-cam-o-to-va-bien-cam-mo-to"
[ "${2:-}" = "--example" ] && example="${3:-}"
[ "${2:-}" = "--bare" ] && example=""
case "$name" in ""|*/*|.*|-*) echo "usage: new-project.sh <name> [--example <example> | --bare]" >&2; exit 2 ;; esac
P="$ROOT/videos/$name"
[ -e "$P" ] && { echo "videos/$name already exists" >&2; exit 1; }
if [ -n "$example" ] && [ ! -d "$HERE/examples/$example" ]; then
  echo "no such example: $example (have: $(ls "$HERE/examples" | tr '\n' ' '))" >&2; exit 1
fi
[ -f "$ENGINE/assets/lib/world/stage.js" ] || { echo "the shared engine is missing: .claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit" >&2; exit 1; }
[ -d "$SK/presets/glass-keynote" ] || { echo "the Vietnamese layer is missing: .claude/skills/vi-explainer-video" >&2; exit 1; }
HF=""
for d in "$ROOT/.kiro/skills" "$ROOT/.claude/skills" "$HOME/.claude/skills"; do [ -d "$d/faceless-explainer" ] && { HF="$d"; break; }; done
[ -n "$HF" ] || { echo "the HyperFrames skills (faceless-explainer) are not installed; see vi-explainer-video/references/install.md" >&2; exit 1; }
hf() { if command -v hyperframes >/dev/null; then hyperframes "$@"; else npx -y hyperframes "$@"; fi; }

mkdir -p "$ROOT/videos"
(cd "$ROOT/videos" && hf init "$name" --non-interactive --example=blank --skill=faceless-explainer) | tail -2
cd "$P"
mkdir -p assets/fonts assets/lib/world scripts
cp "$SK"/assets/fonts/*.woff2 assets/fonts/
node "$HF/faceless-explainer/scripts/build-frame.mjs" --preset glass-keynote --preset-dir "$SK/presets" --hyperframes . | tail -1
# what the series share: the maths of a move, cue reading, assembly and checks (no 3D, no models)
for f in path stage; do cp "$ENGINE/assets/lib/world/$f.js" assets/lib/world/; done
for f in assemble.sh build-cues.mjs check-frames.sh check-watermark.sh frame-times.mjs lock-audio.mjs patch-index.mjs snap.sh; do
  cp "$ENGINE/scripts/$f" scripts/
done
# the street, the signs, the vehicles and the overlay kit of this chapter
cp -R "$HERE/kit/." .
if [ -n "$example" ]; then
  cp -R "$HERE/examples/$example/." .
fi
echo "project: videos/$name"
echo "HF: $HF"
[ -n "$example" ] && echo "example: $example (BRIEF.md, SCRIPT.md, requests, beats/world, build-frames, build-storyboard)"
echo "next: SKILL.md step 3"
