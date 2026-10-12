#!/bin/bash
# Start a house project in project/<name>: the kit of this skill (model library, CAD drafting, studio and web
# builders, web viewer, textures) plus the per-house files of an example as the starting point. Only sources are
# copied; cad/, web/data, web/cad, web/vendor, web/textures and the store tables come from the builds.
#   bash .claude/skills/house-plans-3d/scripts/new-project.sh <name> [--example sample-house]
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
name="${1:-}"; example="sample-house"
[ "${2:-}" = "--example" ] && example="${3:-}"
case "$name" in ""|*/*|.*|-*) echo "usage: new-project.sh <name> [--example <example>]" >&2; exit 2 ;; esac
P="$ROOT/project/$name"
[ -e "$P" ] && { echo "project/$name already exists" >&2; exit 1; }
if [ -z "$example" ] || [ ! -d "$HERE/examples/$example" ]; then
  echo "no such example: $example (have: $(ls "$HERE/examples" | tr '\n' ' '))" >&2; exit 1
fi

mkdir -p "$P/original-drawings"
cd "$P"
cp -R "$HERE/kit/." .
cp -R "$HERE/examples/$example/." .
# The example carries its own name; the new project starts with its folder name as slug.
node -e '
const fs = require("fs"), [file, slug] = process.argv.slice(1);
const config = JSON.parse(fs.readFileSync(file, "utf8"));
config.slug = slug;
fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
' project.json "$name"
echo "project: project/$name"
echo "example: $example (project.json, store/source-dimensions.json, tools/house.mjs, web/content.js, CLAUDE.md)"
echo "next: SKILL.md step 2"
