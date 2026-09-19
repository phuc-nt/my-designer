# Roadmap: where my-designer goes next

Written 2026-09-19 after (1) auditing the fork against upstream
`design-studio-ai` `origin/main`, (2) reviewing what the sibling generators
`my-pptx-generator` and `my-excel-generator` learned, and (3) surveying
comparable products. Items are ordered by value per effort inside the kit's
constraint: **agent-first** — the agent writes through `bin/dsa` and the
in-repo skills, the human edits in the local browser, no MCP server.

## 1. Parity with upstream — done

The fork was archived at upstream `606cfb5`. Upstream has since merged five
first-parent commits; only PR #37 ("OpenDesign-inspired features") carried
product capability. It is now ported (commit `ebd0558`) minus its MCP
surface:

| Feature | Agent surface | Human surface |
| --- | --- | --- |
| Portable design-system folders (`manifest.json` + `DESIGN.md` + `tokens.css`) | `design-systems import --folder`, `export <id> --folder` | Library panel |
| Motion templates `reveal` `stagger` `kinetic-type` `chart-race` | `motion-template list\|instantiate` | Timeline editor |
| Live artifacts (`data.live = {renderer, params}`, renderers `kpi` `stat-list` `progress`) | `update-node`, `blocks get live-kpi` | Inspector "Live artifact" panel |
| Prompt gallery for image/motion generation | `prompts list\|get`, `catalog` | Brief panel |
| SSRF guard on provider fetches | — | — |

Everything else upstream shipped after the fork (footer link, community JSON
budget) is hosted-only and intentionally absent. Nothing feature-bearing was
removed when the fork was made; the diff against upstream HEAD is local-mode
auth, removed cloud/MCP/CI files and docs.

**What the local web editor can and cannot do today.** Direct editing works
for: inline text (double-click), move/resize/rotate, undo/redo,
group/ungroup, duplicate, nudge, layer tree, Inspector fields (geometry,
opacity, fill/stroke, typography, radius, chart values, speaker notes, 3D
geometry/material, timeline duration/fps, live-artifact params), timeline
keyframes, painting workspace, character rig editor, creative boards.
Missing (and present in every mature canvas tool): **align/distribute**,
**snap guides**, **marquee multi-select**, **clipboard copy/paste across
pages**. These are §4 items 1–2.

## 2. Contributions from the generators

| From | What | Status |
| --- | --- | --- |
| `mxg`/`mpg` `text.js` | Glyph-advance text measurement (Latin 0.52 em, East Asian Wide 1 em, combining marks 0) + kinsoku | **Done** — `render.ts` `wrappedLines`/`measureText` (commit `a5b8458`). Fixes wrong `text-overflow` findings and mis-wrapped SVG for Japanese and NFD Vietnamese. |
| `mpg` `export-pptx.js` | PPTX with real text boxes, shapes and images | Proposed — §4 item 3. Today `scripts/export-renderer.ts` rasterises every page into one picture per slide, so the human cannot edit the deck in PowerPoint/Keynote. |
| `mpg` `checks.js` | `text-collision` (two text nodes overlapping), `text-spills-card` / `text-tight-card` (text vs its visual container, not only its parent), contrast against the **topmost shape actually behind** the text | Proposed — §4 item 4. `design-checks.ts` today checks contrast only against the declared parent fill or page background. |
| `mxg` region/table model | A `table` node type (rows × columns, per-cell text/fill/merge) and `xlsx` export | Proposed — §4 item 6. |
| `mxg` stress-test method | Independent fixture, answer key outside the run directory, contamination grep, agent scores itself against the key | Reusable as-is for evaluating the skills; no code change. |

## 3. What comparable products do that we do not

| Product | Model | Worth copying | Not for us |
| --- | --- | --- | --- |
| **OpenDesign** (nexu-io) | Local desktop app; the coding agent *is* the engine; artifacts are real HTML/PDF/PPTX/MP4 files; 140+ `DESIGN.md` design systems; skills; critique gates before export | Portable `DESIGN.md` (ported), quality gates as a named step in the skill, "live dashboards" as an artifact class (ported as live artifacts) | No human canvas editing — the opposite of our two-party model |
| **OpenPencil** | `.op` JSON documents, CLI (`op design`, `op insert`) + MCP + full vector editor, boolean ops, auto-layout, snapping, exports to React/Vue/Svelte/Flutter/SwiftUI/PPTX/PDF, Figma import, git-native | Snap/align/distribute, auto-layout frames, `op insert` batch DSL ≈ our `insert-block`, treating the document as a git artifact (§4 item 8) | Rust rewrite, agent "teams" |
| **Claude Design** (Anthropic Labs) | Chat → prototype/slides/one-pager; refine by inline comments, direct text edits and Claude-generated sliders; design system extracted from a codebase; ingest DOCX/PPTX/XLSX/images; handoff bundle to Claude Code | **Inline comments on the canvas that the agent reads back** (§4 item 5), design-system extraction from a repo (§4 item 9), document ingest as brief material | Hosted, model-locked |
| **mcp_excalidraw** | Canvas server + REST + WebSocket sync; `describe_scene`, `get_canvas_screenshot`, align/distribute tools; human edits stream back to the agent | Align/distribute as **operations** (agent) and buttons (human); live change feed (`document changes` already exists — add a `--follow` stream, §4 item 5) | — |
| **Presenton** | Native editable PPTX from templates, self-hosted, API | Confirms editable PPTX is table stakes; Slidev/Marp (image-per-slide) are the counter-example | Its template DSL |
| **Figma / Penpot / Paper.design MCP, Google Stitch** | Agent reads/writes a hosted canvas | Stitch's `DESIGN.md` convention (ported), Penpot's open format | Hosted, MCP |
| **Claude office skills** (pptx/docx/xlsx) | Agent produces Office files through a skill, no server | Our skills should say *when* to use my-designer vs `mpg`/`mxg` directly (§4 item 10) | — |

## 4. Proposed next steps (ordered)

1. **Align / distribute operations** — `align-nodes {nodeIds, axis, to: start|center|end}` and `distribute-nodes {nodeIds, axis, gap?}` in `browser-design-tools.ts`, exposed in the Inspector as buttons and to the agent as targeted ops. Small; removes the most common reason a page "looks off" in a render. (mcp_excalidraw, OpenPencil)
2. **Snap guides + marquee select + clipboard** in `editor.tsx` — pure human-side; no schema change. Snap to page edges, page centre, sibling edges; marquee on empty canvas; ⌘C/⌘V across pages with fresh IDs.
3. **Editable PPTX export** — port `mpg/src/export-pptx.js`: text nodes → `addText` with font/size/weight/colour/alignment, shapes → `addShape`, images → `addImage`, charts → `addChart`, anything unsupported (3D, boards, artwork, characters) → rasterised as today. Keep the current rasterised path behind `--format pptx --rasterize`. Requires the glyph-advance measurement (done) to size text boxes. (Presenton vs Slidev)
4. **Better preflight** — port `mpg` checks: `text-collision`, `text-spills-container` (text vs the nearest shape/frame whose bounds contain its origin, not only its parent), contrast vs the topmost opaque node behind the text, `crowded-edge` (content within 2% of page edge). Each finding keeps node IDs like today.
5. **Human → agent feedback on the canvas** — a `comment` field per node (Inspector text area, marker on canvas) plus `projects comments <id> [--since n]` and `projects document changes --follow` (SSE) so the agent sees "make this bigger" pinned to a node instead of a chat message. Directly the Claude Design loop; the fork already has `document changes` and revision tracking to build on.
6. **`table` node + `xlsx`/`csv` export** — rows × columns with per-cell text, fill, alignment and merges; renders as a grid in SVG/PNG/PDF, exports as native tables in PPTX (item 3) and as a sheet via `mxg`'s region model. Fills the last gap in "create design files" (slides, web, report, wireframe, 3D, video — but no spreadsheets or tables).
7. **Upstream issues worth taking** — #68 preflight a patch without saving (`projects check --file ops.json`), #67 `upsert-node`, #71 summary responses for mutations (return counts and a page thumbnail hash instead of the full document), #75 cache exports by revision, #17 offline-runnable source export. All CLI-side, all agent ergonomics.
8. **Document-as-git-artifact** — `projects document get --output design.json` is already there; add `projects diff <id> --revision a --revision b` producing a node-level diff and let `projects import` accept a directory of `pages/*.json`. Makes review of agent work possible in a PR. (OpenPencil)
9. **Design system from a codebase** — `design-systems extract --from <dir>` reading Tailwind config / CSS custom properties / existing `DESIGN.md` into the portable folder format (ported), then `import`. (Claude Design, Stitch)
10. **Skill routing between the three kits** — one paragraph in `my-designer/SKILL.md`: a deck that will be edited in PowerPoint → `mpg`; a spreadsheet/form → `mxg`; anything reviewed visually in the browser, animated, 3D, or exported as web/PDF/video → my-designer. Zero code.

Deferred: YAML authoring (#16 — JSON via files already works for agents), Figma import (large, hosted dependency), agent teams/orchestration (belongs in the harness, not the kit), a second MCP surface (rejected by design).

## Sources

- OpenDesign — <https://github.com/nexu-io/open-design>
- OpenPencil — <https://github.com/open-pencil/open-pencil>, skill/CLI notes <https://github.com/ZSeven-W/openpencil-skill>
- Claude Design (Anthropic Labs, 2026-04-17) — <https://www.anthropic.com/news/claude-design-anthropic-labs>, coverage <https://venturebeat.com/technology/anthropic-just-launched-claude-design-an-ai-tool-that-turns-prompts-into-prototypes-and-challenges-figma>
- mcp_excalidraw — <https://github.com/yctimlin/mcp_excalidraw>
- Presenton — <https://github.com/presenton/presenton>
- Upstream issues — <https://github.com/bestagentkits/design-studio-ai/issues>
