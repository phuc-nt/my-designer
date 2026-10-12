#!/bin/bash
# Rebuild kit/assets/lib/three-bundle.js from the three.js in this repo's node_modules. Only needed
# to move to another three.js version or to add a loader; the bundle in the kit was built from 0.185.1.
#   bash .claude/skills/chuong-6-sa-hinh-va-xu-ly-tinh-huong-video/scripts/build-three-bundle.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cat > "$TMP/entry.js" <<'JS'
export * from "three";
export { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
export * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
export { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
JS
NODE_PATH="$ROOT/node_modules" "$ROOT/node_modules/.bin/esbuild" "$TMP/entry.js" --bundle --format=esm --minify \
  --legal-comments=none --outfile="$HERE/kit/assets/lib/three-bundle.js"
node -e 'console.log("three", require(process.argv[1]).version)' "$ROOT/node_modules/three/package.json"
