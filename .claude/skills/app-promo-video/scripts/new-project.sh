#!/bin/bash
# Start an app promo video: a HyperFrames faceless-explainer project in videos/<name>, the Vietnamese fonts of
# vi-explainer-video, and an app UI kit to fill in (.hyperframes/app-ui-kit). On an existing project it only adds
# the kit files that are missing, so it never overwrites a kit in progress.
#   bash new-project.sh <name>
set -euo pipefail
name="${1:-}"
[ -n "$name" ] || { echo "usage: new-project.sh <name>" >&2; exit 2; }
sk="$(cd "$(dirname "$0")/.." && pwd)"
vi="$sk/../vi-explainer-video"
[ -d "$vi/assets/fonts" ] || { echo "vi-explainer-video not found next to this skill ($vi)" >&2; exit 2; }
root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
dir="$root/videos/$name"
hf() { if command -v hyperframes >/dev/null; then hyperframes "$@"; else npx -y hyperframes "$@"; fi; }

if [ ! -d "$dir" ]; then
  mkdir -p "$root/videos"
  (cd "$root/videos" && hf init "$name" --non-interactive --example=blank --skill=faceless-explainer)
fi
mkdir -p "$dir/assets/fonts" "$dir/.hyperframes/app-ui-kit/screens" "$dir/.hyperframes/app-voice"
for f in "$vi"/assets/fonts/*.woff2; do [ -e "$dir/assets/fonts/$(basename "$f")" ] || cp "$f" "$dir/assets/fonts/"; done
for f in kit.css RULES.md screens/example.html; do
  [ -e "$dir/.hyperframes/app-ui-kit/$f" ] || cp "$sk/templates/kit/$f" "$dir/.hyperframes/app-ui-kit/$f"
done
echo "project: $dir"
echo "kit:     $dir/.hyperframes/app-ui-kit (kit.css, RULES.md, screens/example.html: replace with the app's screens)"
echo "next:    BRIEF.md, then the kit from the app's source, then: node $sk/scripts/ui-kit.mjs preview $dir"
