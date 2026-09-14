---
name: my-designer
description: Create, inspect, refine and export structured web designs, slides, reports, wireframes, 3D scenes and timeline videos in the local my-designer studio through the dsa CLI, then hand the human a web-UI link to review and edit.
---

# my-designer

A local design studio. You write through `bin/dsa`; the human reviews and edits
in the browser at `http://localhost:<port>/?project=<id>`. Everything here is
the CLI; there is no MCP server in this kit. Where a reference file under
`references/` mentions an MCP tool name, use the CLI command it pairs with.

## Establish the brief

Reuse what you already know about audience, purpose, deliverable, dimensions,
brand, content and success criteria. Ask only for choices that materially
change the result. Respect supplied assets and exact copy.

For a prompt-driven project, `bin/dsa brief get <id>` / `brief put` persist an
interview: a concise message, up to eight questions with stable IDs, and a
proposed scope (objective, audience, direction, deliverables, constraints,
acceptance criteria). Persist answers rather than guessing. Approve a scope
only after the human explicitly agreed to that version; brief revisions are
separate from document revisions and a 409 means re-read and reconcile.

## Connect and inspect

`bin/dsa health`, then `bin/dsa catalog` (or `themes list`, `templates list
--kind slides`, `blocks list`). Inspect entries before choosing them.
`bin/dsa schema` is the document shape; `bin/dsa schema --operations` the
targeted-edit shapes. Both are generated from the real validators; the server
additionally checks IDs, parents, timeline references and ownership.

```sh
bin/dsa projects create --name "Quarterly narrative" --template product-deck
bin/dsa projects get PROJECT_ID > /tmp/project.json
```

`get` returns `{project:{id,revision,document,…}}`. Keep the observed
`revision` with the document you read. Read real page and node IDs from it;
never invent IDs for existing elements.

## Choose the design-kind guidance

Read [layout and quality](references/layout-and-quality.md) first, then the
reference for the document `kind`:

| Kind | Reference |
| --- | --- |
| `web` | [web.md](references/web.md) — flex-first reading flow, components, responsive review |
| `slides` | [slides.md](references/slides.md) — narrative, hierarchy, audience-scale review |
| `report` | [report.md](references/report.md) — evidence, editorial flow, page and chart review |
| `wireframe` | [wireframe.md](references/wireframe.md) — task flows, states, interaction review |
| `3d` | [3d.md](references/3d.md) — staging, materials, camera, mesh and export review |
| `video` | [video.md](references/video.md) — readable beats, motion, sound, playback review |

Flex for ordinary content relationships, Grid for real two-dimensional
structure, absolute placement only for intentional overlays, fixed
compositions, scene staging or motion. Fix overflow by fixing structure and
space before shrinking type or changing approved copy.

## Refine through targeted operations

Prefer a small operations array over replacing the whole design:

```json
[
  {"op":"update-node","nodeId":"ACTUAL_NODE_ID","changes":{"text":"The next chapter","style":{"fontSize":64}}},
  {"op":"apply-theme","themeId":"atelier"}
]
```

```sh
bin/dsa projects document patch PROJECT_ID --revision OBSERVED --file ops.json
```

Two facts about `update-node` that are easy to get wrong:

- Only `style` is merged. **Every other field in `changes` replaces the
  node's field wholesale.** To change one key inside `scene`, `layout`,
  `data` or `component`, copy the whole sub-object from what you read and
  edit the one key.
- The shape is `{op, nodeId, changes:{…}}` — not `node:{…}`.

A 409 means the human changed the project. Read the new revision, compare
your intended edits, reapply only what still makes sense. Never raise
`--revision` blindly, never overwrite the whole document to hide a conflict.
For longer concurrent work, `projects document changes` shows saved updates
and `projects document merge` reconciles against the exact base you read.

`bin/dsa generate` can ask a configured provider for a proposal; it does not
save. Inspect the proposal before `document put`. Without a provider key it
fails with `provider_unconfigured` — expected in this kit.

## 3D scenes

Transforms render from `scene.{position,rotation,scale,material}` only.
`data.{position,rotation,scale}` is ignored. Rotation is in degrees about the
object's own centre, so a rotated slab moves its edges — compute where an
edge lands rather than eyeballing. Confirm with a render, not with the
numbers alone. `bin/dsa scene inspect PROJECT_ID` summarises the scene;
`references/3d.md` covers characters, lighting and export.

## Assets and media

`bin/dsa assets upload PROJECT_ID --file image.png` returns an asset; insert a
node that references it. `assets list` / `assets download` inspect stored
results. `replace-asset` swaps uses of one asset for another of the same
media kind. Provider keys are set by the human in Settings or via
`providers set … --key-env`; never pass raw credentials through prompts,
documents or tool arguments.

## Inspect quality and deliver

Read [visual inspection](references/visual-inspection.md). Render with
`bin/dsa projects inspect PROJECT_ID --output review.png` (page mode for
detail) or `projects overview --output-dir review`, then **open the PNG**.
Successful rendering, a saved revision, or JSON metadata is not visual
evidence. Run `bin/dsa projects check PROJECT_ID` on the saved revision;
findings carry page/node IDs for focused fixes, then check again.

For web, inspect the narrow viewport first. Check contrast, text fitting,
hierarchy, alignment, spacing, typography, asset sharpness and intact
content. For 3D and motion, inspect the real render, not a static
representation.

Exports go through the local Chromium: `bin/dsa projects export PROJECT_ID
--format pptx --output out.pptx --revision OBSERVED`. Discover formats with
`projects export --help`; binary formats need `--output`. Open the result and
confirm it contains what you expect.

Report the `?project=<id>` link, what changed, what you verified and what you
did not. Do not claim export fidelity or visual quality without having looked.
