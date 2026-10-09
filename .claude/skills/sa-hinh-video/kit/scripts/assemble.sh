#!/bin/bash
# Rebuild the overlay frames and put the video back together (frames → index → world mount → transitions).
#   bash scripts/assemble.sh [--captions]
set -euo pipefail
cd "$(dirname "$0")/.."
HF="${HF:-$HOME/.claude/skills}"
FX="$HF/faceless-explainer/scripts"
SK="${SK:-$(git rev-parse --show-toplevel)/.claude/skills/vi-explainer-video}"
node scripts/build-frames.mjs > /dev/null
bash scripts/check-frames.sh
# built and clean: the storyboard may call them animated
perl -pi -e 's/^- status: outline$/- status: animated/' STORYBOARD.md
if [ "${1:-}" = "--captions" ]; then
  node "$FX/captions.mjs" build --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes . --out ./caption_groups.json | tail -1
  node "$SK/scripts/regroup-vi.mjs" . 9 > /dev/null
fi
node "$FX/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . | grep -E 'bgm|total'
node scripts/patch-index.mjs
node "$FX/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes . > /dev/null
node "$FX/transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html | tail -1
