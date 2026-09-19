# dsa CLI — verified command surface

Extracted from `packages/cli/src/*.ts` of this build and exercised against a
running kit server. Run `bin/dsa <group> <cmd> --help` for anything not
listed. Note: `bin/dsa projects document --help` (a group without a
subcommand) prints the root help — ask for the concrete subcommand.

Global: `--url`, `--api-key`, `--timeout <ms>` (default 180000), `--json`
(default). `bin/dsa` fills URL and a placeholder key from `.env.local`.
Output is JSON on stdout; errors are JSON on stderr; exit codes 0 ok,
1 input/API/conflict, 2 auth, 3 network, 4 local file/runtime.
`--file -` reads stdin for every JSON input.

## Discovery

| Command | Notes |
| --- | --- |
| `health`, `config` | server up; public config |
| `schema` | document JSON Schema (large — redirect to a file) |
| `schema --operations` | targeted-operation shapes ([operations.md](operations.md)) |
| `scene schema` | **separate** schema of the 29 `scene command` actions (see `../../my-designer-3d/`) |
| `catalog` | themes + templates + blocks + prompts in one call |
| `prompts list [--kind image\|motion]` / `prompts get <id>` | ready generation prompts with provider, model and aspect ratio; pass `.prompt.prompt` to `media generate --prompt` |
| `themes list` / `themes get <id>` | |
| `templates list [--kind k]` / `templates get <id>` | |
| `templates instantiate <id> [--name n] [--theme id] [--output f\|-]` | fresh IDs, document JSON, not saved |
| `blocks list` / `blocks get <id> [--offset px]` | reusable node groups; `get` returns `{nodes}` to feed `add-node` or use `insert-block` |
| `fonts --query <text>` | bundled/Google font metadata |
| `design-systems schema\|list\|get <id> [--system-version n]\|versions <id>` | reusable token/component libraries |
| `design-systems import --folder <dir>` / `design-systems export <id> --folder <dir> [--system-version n]` | portable `manifest.json` + `DESIGN.md` + `tokens.css` folder ⇄ saved library; the compiled JSON stays the authority |

## Projects

| Command | Flags |
| --- | --- |
| `projects list` | `--query`, `--kind`, `--sort updated\|created\|name` |
| `projects get <id>` | → `{project:{id,name,kind,revision,document,thumbnailUrl,…}}` |
| `projects create` | `--name` (required), `--description`, `--kind web\|slides\|report\|wireframe\|3d\|video`, `--template <id>`, `--theme <id>`, `--file doc.json` |
| `projects import --file doc.json [--name]` | new project from canonical JSON |
| `projects clone <id> [--name]` | copies assets too |
| `projects rename <id> <name> --revision n` | |
| `projects delete <id>` | deletes stored assets as well; no confirmation |
| `projects check <id>` | read-only preflight; findings carry page/node IDs |
| `projects document get <id> [--output f]` | the raw document |
| `projects document patch <id> --file ops.json --revision n` | the normal write |
| `projects document put <id> --file doc.json --revision n [--brief-revision n]` | whole-document replace |
| `projects document changes <id> [--since n]` | what the human saved since `n` |
| `projects document merge <id> --file merge.json` | `{base,document,baseRevision}` three-way merge |
| `projects paint <id> --file cmd.json` | raster stroke/fill on a painting node |
| `projects thumbnail <id> --output cover.png [--revision n]` | 202 = still rendering, retry |

## Inspect (render to PNG)

```
projects inspect <id> --output f.png [--mode overview|page] [--page <index> | --page-id <id>]
                      [--revision n] [--time s] [--offset n] [--limit 1-12] [--columns 1-4]
                      [--tile-size 160-800] [--max-dimension 256-2048]
projects overview --output-dir dir [--offset n] [--limit 1-12] [--time s] [--tile-size px]
```

- Default is `overview`: a contact sheet of up to 6 pages; follow
  `nextOffset` with `--offset` until null.
- `--mode page` renders one page at up to `--max-dimension` px (default
  1600). The flag is `--max-dimension`; `--max-edge` does not exist.
- `--page` is a zero-based **index** here and in `export`; `--page-id` is the
  saved page ID. (`scene command`/`scene inspect --page` take the **ID**.)
- stdout JSON has `items[]` (projectId, revision, pageId, pageIndex, bounds)
  and `images[].path`. Open the file; the JSON is not evidence.

## Export

```
projects export <id> --format F [--output f] [--page <index>] [--revision n]
                     [--start s] [--end s] [--fps n] [--review-samples 2-25] [--node <id>]
render --file doc.json --format json|html|svg [--output f] [--page i] [--time s]
```

Formats: `json html svg png pdf pptx webm mp4 react glb gltf motion
png-sequence spritesheet scene-angles editable-scene`. Binary formats need
`--output`. `--start/--end/--fps` drive frame/video exports;
`--review-samples` and `--start/--end` drive `scene-angles`; `--node` is
for `editable-scene`. `render` is offline and static (3D becomes a symbol);
server `export --format html` embeds the real interactive viewer.

## Assets

| Command | |
| --- | --- |
| `assets upload <projectId> --file f [--mime type]` | → `{asset:{id,name,type,mimeType,url,size}}`; `url` is `/api/assets/<id>` — put it in a node's `src` |
| `assets list <projectId>` | |
| `assets download <assetId> --output f` | |

## 3D and motion

| Command | |
| --- | --- |
| `scene inspect <id> [--page <pageId>] [--time s]` | per-node `editableMesh`, vertices, triangles, bones, bounds, issues |
| `scene scan <id> --page <pageId> [--samples 2-61]` | sampled diagnostics across the animation |
| `scene command <id> --page <pageId> --revision n --file cmd.json [--apply]` | preview unless `--apply` |
| `scene schema` | the 29 command shapes |
| `motion <id> [--character id] [--node id] [--time s] [--review-samples n]` | 2D character rigs / pose sampling |
| `motion-template list` / `motion-template instantiate <id> [--name n] [--output f\|-]` | `reveal` `stagger` `kinetic-type` `chart-race` → a video document with compiled keyframes, not saved (see `../../my-designer-motion/`) |

## Brief, generation, operations

| Command | |
| --- | --- |
| `brief get <id>` / `brief put <id> --revision n --file brief.json` / `brief approve <id> --revision n` | brief revision 0 creates; every put invalidates approval |
| `brief interview <id> --revision n --provider p [--model m]` | needs a provider |
| `generate <id> --provider p --revision n [--mode document\|motion] [--prompt t\|--prompt-file f] [--model m] [--output f]` | proposal only; save with `document put` |
| `media generate <id> --kind image\|audio\|video --provider p …` / `media status <id> <jobId>` | needs a provider |
| `operations start <id> --file job.json` / `status <id> <opId>` / `result <id> <opId> --out f` | durable long saves/exports |
| `observability summary\|events [--kind export …] [--limit n]\|trace <id>` | what happened server-side (useful when an export 502s) |
| `api <METHOD> </api/path> [--file body.json]` | same-origin REST escape hatch |

`publish/unpublish/preview/share` exist but create public snapshots meant
for a hosted deployment; on a loopback server they only matter if you
tunnel the port. `tokens`, `providers`, `community` are for the human.
