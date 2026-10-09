#!/bin/bash
# Export the 3D studio projects behind the kit's models to GLB again (read-only on the studio side).
# The ids are those of the studio database on the machine the models were built on; elsewhere the
# GLB files in kit/assets/models are the source. Needs the local studio: node bootstrap.mjs --status
#   bash .claude/skills/sa-hinh-video/scripts/export-models.sh [<output dir>]      default: kit/assets/models
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
OUT="${1:-$HERE/kit/assets/models}"
mkdir -p "$OUT"
cd "$ROOT"
while read -r id name; do
  [ -z "$id" ] && continue
  if bin/dsa projects export "$id" --format glb --output "$OUT/$name.glb" > /dev/null 2>&1; then echo "ok   $name"; else echo "FAIL $name ($id)"; fi
done <<'LIST'
311928df-4c01-44ad-9bad-138ebbfc4cad car-red
dd419f54-692a-4312-949a-ad73bbed3d50 car-purple
147d2979-8eab-4979-9f00-6777d660d17b truck-teal
31b9cc40-8051-4310-ac0a-bc35fb287aa2 truck-dark
c5c036ff-8695-4e5b-969d-acc406b28425 moto
6dd8e61b-a775-4685-b475-e613ec16c770 bus
1d5d1359-29cc-4e36-9f29-7a9d4f62264c traffic-light
d59cf407-758a-46a9-9c1c-cb34514b5a64 sign-post
5ec4ad27-2915-4942-a46d-f6787c02ec8a lamp-post
992146ac-ce64-460f-8b30-2e0e1b661a71 cone
66993fee-43c8-42a3-8e17-a2c08a018f35 bollard
755e4658-1dc8-474e-9298-6c0c551b3f28 tree
LIST
