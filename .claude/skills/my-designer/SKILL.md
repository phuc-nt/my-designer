---
name: my-designer
description: Design work in this repo's local studio through the dsa CLI — create, edit, inspect and export web pages, slides, reports and wireframes, handle revision conflicts with the human's browser edits, and hand over a ?project= link. Also the entry point that routes 3D scenes to my-designer-3d and animation/video to my-designer-motion.
---

# my-designer

You write through `bin/dsa`; the human reviews and edits in the browser at
`http://localhost:<port>/?project=<id>`. There is no MCP, no token, no
sign-in. Everything below is the CLI; exact flags are in
[cli.md](references/cli.md) (verified against this build — use it instead of
guessing, and `bin/dsa <group> <cmd> --help` when in doubt).

## Route by kind first

| Kind / task | Read |
| --- | --- |
| `web` | [web.md](references/web.md) |
| `slides` | [slides.md](references/slides.md) |
| `report` | [report.md](references/report.md) |
| `wireframe` | [wireframe.md](references/wireframe.md) |
| `3d` — anything with a camera, lights, meshes, GLB | **`../my-designer-3d/SKILL.md`** |
| `video`, timelines, keyframes, 2D characters, mp4/webm/frames | **`../my-designer-motion/SKILL.md`** |

Read [layout-and-quality.md](references/layout-and-quality.md) once for any
2D kind. Every kind shares the workflow below.

## Workflow

```sh
bin/dsa health                                   # server up? else: node bootstrap.mjs --status
bin/dsa templates list --kind slides             # or catalog / themes list / blocks list
bin/dsa projects create --name "Q3 deck" --kind slides --template product-deck
bin/dsa projects get <id> > p.json               # {project:{id,revision,document,…}} — keep revision
bin/dsa projects document patch <id> --file ops.json --revision <n>
bin/dsa projects check <id>                      # deterministic preflight with node IDs
bin/dsa projects inspect <id> --output review.png # render → OPEN THE PNG
bin/dsa projects export <id> --format pptx --output out.pptx --revision <n>
```

1. **Brief.** Reuse what the human already said (audience, purpose, size,
   brand, copy). Ask only about choices that change the result. For
   prompt-driven work `brief get/put/approve` persist questions, answers and
   scope; approve only after the human agreed to that version. Brief
   revisions are separate from document revisions.
2. **Create** from a template (`projects create --template`), from a theme
   only (`--kind --theme`), or from JSON you built offline
   (`templates instantiate <id> --output doc.json`, edit, `projects import
   --file doc.json`). Inspect a template before choosing it.
3. **Read, then write small.** Use real page and node IDs from `projects get`;
   never invent IDs for existing elements. Prefer a short operations array
   ([operations.md](references/operations.md)) to `document put`.
4. **Inspect** (below), fix, inspect again. Then export and open the file.
5. **Deliver** the `?project=<id>` link, what changed, what you verified,
   what you did not.

## Targeted operations — the two traps

```json
[{"op":"update-node","nodeId":"REAL_ID","changes":{"text":"Next chapter","style":{"fontSize":64}}},
 {"op":"apply-theme","themeId":"atelier"}]
```

- Shape is `{op, nodeId, changes:{…}}`, not `node:{…}`.
- **Only `style` merges.** Every other key in `changes` replaces the node's
  key wholesale: `changes:{scene:{material:{color}}}` deletes `position`,
  `rotation`, `scale` and any `mesh`; `changes:{data:{…}}` or
  `changes:{component:{…}}` likewise. Recipe: load the node from the JSON
  you read, mutate the one field in memory, send the whole sub-object back.
  [operations.md](references/operations.md) has the snippet.

## 409 and concurrent editing

A 409 (`revision_conflict` on document writes, `conflict` on scene
commands) means the human saved from the browser. Re-read `projects get`,
diff against what you intended, reapply only what still makes sense with
the new `--revision`. Never raise the number blindly; never `document put`
the old document to hide a conflict. For long sessions,
`projects document changes <id> --since <n>` shows what changed and
`projects document merge <id> --file {base,document,baseRevision}` does a
three-way merge that returns conflict paths instead of clobbering.

## Inspect quality

Read [visual-inspection.md](references/visual-inspection.md). Page mode for
detail (`--mode page --page 0 --max-dimension 1600`), overview contact sheet
for coverage (`--limit`, follow `nextOffset` with `--offset`). Open every
PNG you claim to have reviewed. `projects check` findings point at node IDs
but do not certify fonts, contrast after compositing, rotation or motion.
For web inspect the narrow layout too; for anything animated sample
`--time`. Do not report visual quality you have not looked at.

**Measurements outrank impressions — once you have checked the
measurement.** When numbers from the document (or `check`, or an export's
own report) disagree with your reading of a render, do not settle it by
which feels more convincing. First confirm the arithmetic models the
runtime: a formula built on a wrong constant is not evidence, and a
plausible-looking calculation over the wrong units has both hidden real
defects and invented ones here. Then, with the numbers verified, they
stand until you can name the exact node the contradicting pixels belong
to — renders are easy to misread (a cropped frame, a node hidden behind
another, a similarly named sibling). Re-measure or isolate the node; do
not overwrite verified arithmetic with a feeling, in either direction.

## Assets, media, providers

`bin/dsa assets upload <id> --file img.png` returns
`{asset:{id,url,type,mimeType}}`; the upload is library-only — add a node
whose `src` is that `url` (images, video, audio, GLB). `assets list` /
`assets download <assetId> --output f`. `replace-asset` swaps every use of
one asset for another of the same media kind. Provider keys are configured
by the human (`providers set <id> --key-env VAR`); `generate`, `brief
interview` and `media generate` fail with `provider_unconfigured` until
then — say so, do not treat it as broken. `bin/dsa prompts list --kind
image` holds ready prompts with a provider, model and aspect ratio; keep
the entry's attribution if you quote it.

A **live artifact** is a node whose `data.live` is `{renderer, params}`
(`renderer` ∈ `kpi` `stat-list` `progress`, `params` scalar). It re-renders
from its params, the human tweaks them in the Inspector, you change them
with `update-node`; a malformed `data.live` is rejected on write. The
`live-kpi` block (`blocks get live-kpi`) is the starting point.

## Big JSON without flooding your context

A project is 30–100 KB (a mesh can be 1 MB). Keep it in files and filter:

```sh
bin/dsa projects get <id> > p.json
python3 -c "import json;d=json.load(open('p.json'))['project'];print(d['revision']);[print(n['id'],n['type'],n.get('name')) for n in d['document']['pages'][0]['nodes']]"
```

`node -e` works too, but environment variables reach it only if exported
(`export S=…` before `node -e 'process.env.S'`), otherwise you get
`Cannot find module 'undefined/…'`. macOS has no `timeout`; run `tsx` via
`npx tsx`.

## Ambition

The kit does more than boxes and text: components, grids, themes and design
systems, block libraries, 3D meshes you can sculpt and remesh, PBR maps,
lights, keyframe timelines, 2D character rigs, PPTX/PDF/MP4/GLB exports.
Before telling the human "this kit cannot do X", grep the relevant skill and
`bin/dsa schema` / `bin/dsa scene schema`. Report real limits; do not invent
them.
