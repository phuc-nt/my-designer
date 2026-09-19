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
Since then §4 items 1–2 added **align/distribute**, **snap guides**,
**marquee multi-select** and **clipboard copy/paste across pages**, item 5
added canvas comments, and item 6 a table grid editor.

## 2. Contributions from the generators

| From | What | Status |
| --- | --- | --- |
| `mxg`/`mpg` `text.js` | Glyph-advance text measurement (Latin 0.52 em, East Asian Wide 1 em, combining marks 0) + kinsoku | **Done** — `render.ts` `wrappedLines`/`measureText` (commit `a5b8458`). Fixes wrong `text-overflow` findings and mis-wrapped SVG for Japanese and NFD Vietnamese. |
| `mpg` `export-pptx.js` | PPTX with real text boxes, shapes and images | **Done** — `src/shared/pptx-export.ts` (commit `95b7a22`); rasterised path kept behind `--rasterize`. |
| `mpg` `checks.js` | `text-collision` (two text nodes overlapping), `text-spills-card` / `text-tight-card` (text vs its visual container, not only its parent), contrast against the **topmost shape actually behind** the text | **Done** — `design-checks.ts` (commit `1aecde1`): `text-collision`, `text-spills-container`, contrast vs the topmost opaque backdrop, `crowded-edge`. |
| `mxg` region/table model | A `table` node type (rows × columns, per-cell text/fill/merge) and `xlsx` export | **Done** — `src/shared/table.ts` + `spreadsheet-export.ts` (§4 item 6). The xlsx is written as OOXML through JSZip rather than through `exceljs`, so the server stays dependency-light. |
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

## 4. Next steps — all ten shipped (2026-09-19)

Each item below was delivered as one conventional commit; the hash is the
commit to read for the details.

1. **Align / distribute operations** — **Done** (`d904b06`): `align-nodes`, `distribute-nodes` and `upsert-node` in `operations.ts` with pure maths in `alignment.ts`; Inspector and selection-bar buttons for the human. (mcp_excalidraw, OpenPencil)
2. **Snap guides + marquee select + clipboard** — **Done** (`a9302dc`): `editor-snapping.ts`, `editor-marquee.ts`, `node-selection.ts`; snap to page edges/centre and sibling edges, marquee on empty canvas, ⌘C/⌘X/⌘V across pages with fresh IDs.
3. **Editable PPTX export** — **Done** (`95b7a22`): `pptx-export.ts` emits text boxes, shapes, images, charts (and, since item 6, tables); unsupported layers are rasterised per node and listed in the notes; `--rasterize` keeps the picture-per-slide path. (Presenton vs Slidev)
4. **Better preflight** — **Done** (`1aecde1`): `text-collision`, `text-spills-container`, contrast vs the topmost opaque backdrop, `crowded-edge`, all with node IDs.
5. **Human → agent feedback on the canvas** — **Done** (`cc2191a`): comments on layers and pages inside the document, `projects comments`, `document changes --follow` (polling, one JSON line per revision), `projects check --file` preflight, `--summary` responses. (Claude Design)
6. **`table` node + `xlsx`/`csv` export** — **Done** (commit `feat: table node with xlsx/csv export, design-system extract and kit routing`): `table.ts` model (cells with text/fill/colour/alignment/bold/spans, header rows, column widths), SVG grid render, Inspector grid editor, toolbar button and catalog block, native PowerPoint tables, `xlsx` (one sheet per page with tables) and `csv` (first table on a page) written server-side without a browser.
7. **Upstream issues worth taking** — **Done**: #67 `upsert-node` (`d904b06`), #68 `projects check --file` and #71 summary responses (`cc2191a`), #75 revision-keyed export cache (`1304d12`). #17 offline-runnable source export was already covered by `render` + React export.
8. **Document-as-git-artifact** — **Done** (`1304d12`): `projects diff`, `document get --output-dir` page folders, `document put --dir` / `import --dir`. Revisions are still not stored, so diffs compare files or a file against the live project. (OpenPencil)
9. **Design system from a codebase** — **Done** (same commit as item 6): `design-systems extract --from <dir> [--import]` with the pure `design-system-extract.ts` (CSS custom properties, regex-parsed Tailwind config, existing `DESIGN.md`). (Claude Design, Stitch)
10. **Skill routing between the three kits** — **Done** (same commit as item 6): the "When a sibling kit fits better" paragraph in `my-designer/SKILL.md`.

Deferred: YAML authoring (#16 — JSON via files already works for agents), Figma import (large, hosted dependency), agent teams/orchestration (belongs in the harness, not the kit), a second MCP surface (rejected by design).

## Sources

- OpenDesign — <https://github.com/nexu-io/open-design>
- OpenPencil — <https://github.com/open-pencil/open-pencil>, skill/CLI notes <https://github.com/ZSeven-W/openpencil-skill>
- Claude Design (Anthropic Labs, 2026-04-17) — <https://www.anthropic.com/news/claude-design-anthropic-labs>, coverage <https://venturebeat.com/technology/anthropic-just-launched-claude-design-an-ai-tool-that-turns-prompts-into-prototypes-and-challenges-figma>
- mcp_excalidraw — <https://github.com/yctimlin/mcp_excalidraw>
- Presenton — <https://github.com/presenton/presenton>
- Upstream issues — <https://github.com/bestagentkits/design-studio-ai/issues>
