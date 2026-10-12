#!/bin/bash
# Start a video of the "Kỹ thuật lái xe" chapter in videos/<name>: a HyperFrames project, the
# Vietnamese fonts, the glass-keynote design, the shared 3D engine and models (taken from the
# chuong-6-sa-hinh-va-xu-ly-tinh-huong-video kit), the road stage and overlay kit of this skill, and the per-lesson files of a
# finished lesson as the starting point.
#   bash .claude/skills/chuong-3-ky-thuat-lai-xe-video/scripts/new-project.sh <name> [--example bai-05-khi-khong-nhin-ro | --bare]
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
SK="$ROOT/.claude/skills/vi-explainer-video"
ENGINE="$ROOT/.claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit"
name="${1:-}"; example="bai-05-khi-khong-nhin-ro"
[ "${2:-}" = "--example" ] && example="${3:-}"
[ "${2:-}" = "--bare" ] && example=""
case "$name" in ""|*/*|.*|-*) echo "usage: new-project.sh <name> [--example <example> | --bare]" >&2; exit 2 ;; esac
P="$ROOT/videos/$name"
[ -e "$P" ] && { echo "videos/$name already exists" >&2; exit 1; }
if [ -n "$example" ] && [ ! -d "$HERE/examples/$example" ]; then
  echo "no such example: $example (have: $(ls "$HERE/examples" | tr '\n' ' '))" >&2; exit 1
fi
[ -d "$ENGINE/assets/models" ] || { echo "the shared engine is missing: .claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/kit" >&2; exit 1; }
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
# the engine both series share: the three.js bundle, the models, cue reading, assembly and checks
cp -R "$ENGINE/assets/models" assets/
cp "$ENGINE/assets/lib/three-bundle.js" assets/lib/
for f in path stage models; do cp "$ENGINE/assets/lib/world/$f.js" assets/lib/world/; done
for f in assemble.sh build-cues.mjs check-frames.sh check-watermark.sh frame-times.mjs lock-audio.mjs patch-index.mjs snap.sh; do
  cp "$ENGINE/scripts/$f" scripts/
done
# the road stage and the overlay kit of this chapter
cp -R "$HERE/kit/." .
if [ -n "$example" ]; then
  cp -R "$HERE/examples/$example/." .
fi
echo "project: videos/$name"
echo "HF: $HF"
[ -n "$example" ] && echo "example: $example (BRIEF.md, SCRIPT.md, requests, beats/drive/world, build-frames, build-storyboard)"
echo "next: SKILL.md step 3"
